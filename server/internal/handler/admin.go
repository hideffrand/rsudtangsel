package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/middleware"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// AdminHandler handles all HTTP requests for admin endpoints.
type AdminHandler struct {
	authSvc         *service.AuthService
	dashboardSvc    *service.DashboardService
	appointmentRepo *repository.AppointmentRepository
}

// NewAdminHandler creates a new AdminHandler instance.
func NewAdminHandler(
	authSvc *service.AuthService,
	dashboardSvc *service.DashboardService,
	appointmentRepo *repository.AppointmentRepository,
) *AdminHandler {
	return &AdminHandler{
		authSvc:         authSvc,
		dashboardSvc:    dashboardSvc,
		appointmentRepo: appointmentRepo,
	}
}

// Login handles POST /api/admin/login
// Validates credentials and returns JWT tokens.
func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errMsg := req.Validate(); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	ip := extractClientIP(r)
	userAgent := r.Header.Get("User-Agent")

	loginResp, err := h.authSvc.Login(req.Username, req.Password, ip, userAgent)
	if err != nil {
		if err.Error() == "invalid credentials" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid username or password")
			return
		}
		utils.ErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}

	setAuthCookies(w, r, loginResp.AccessToken, loginResp.RefreshToken)
	utils.SuccessResponse(w, http.StatusOK, loginResp, "Login successful")
}

// RefreshToken handles POST /api/admin/refresh
// Rotates the refresh token and returns a new access token.
// The refresh token comes from the JSON body (API clients) or the
// refresh_token cookie (web session).
func (h *AdminHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.RefreshToken == "" {
		req.RefreshToken = cookieValue(r, middleware.CookieRefreshToken)
	}
	if req.RefreshToken == "" {
		utils.ErrorResponse(w, http.StatusUnauthorized, "refresh_token is required")
		return
	}

	resp, err := h.authSvc.RefreshToken(req.RefreshToken)
	if err != nil {
		clearAuthCookies(w)
		utils.ErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}

	setAuthCookies(w, r, resp.AccessToken, resp.RefreshToken)
	utils.SuccessResponse(w, http.StatusOK, resp, "Token refreshed")
}

// Logout handles POST /api/admin/logout
// Deletes the refresh token from the database and clears the auth cookies.
// This operation is idempotent.
func (h *AdminHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.RefreshToken == "" {
		req.RefreshToken = cookieValue(r, middleware.CookieRefreshToken)
	}
	_ = h.authSvc.Logout(req.RefreshToken)
	clearAuthCookies(w)
	utils.SuccessResponse(w, http.StatusOK, nil, "Logged out successfully")
}

// Me handles GET /api/admin/me
// Returns the profile of the authenticated user (from the JWT claims, either
// Bearer header or cookie). Used by the web admin auth context and by the
// Next.js proxy to validate the session.
func (h *AdminHandler) Me(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	profile, err := h.authSvc.GetProfile(middleware.GetUserID(r.Context()))
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, "Sesi tidak valid")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, profile)
}

// DashboardStats handles GET /api/admin/dashboard/stats
// Returns aggregated statistics for the current day.
func (h *AdminHandler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	stats, err := h.dashboardSvc.GetStats()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve statistics: "+err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, stats)
}

// AdminQueue handles GET /api/admin/queue
// Returns the appointment queue with patient and doctor details.
// Query params: poli (specialty filter), date (defaults to today)
func (h *AdminHandler) AdminQueue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	specialty := r.URL.Query().Get("poli")
	date := r.URL.Query().Get("date")
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}

	var (
		items interface{}
		err   error
	)

	if specialty != "" {
		items, err = h.appointmentRepo.FindByDepartmentAndDateWithPatient(specialty, date)
	} else {
		items, err = h.appointmentRepo.FindAllByDateWithPatient(date)
	}

	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Failed to retrieve queue: "+err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, items)
}

// UpdateQueueStatus handles PATCH /api/admin/queue/{id}/call or /skip
// URL format: /api/admin/queue/123/call or /api/admin/queue/123/skip
func (h *AdminHandler) UpdateQueueStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, action, err := parseQueuePath(r.URL.Path)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	// Map action to the corresponding database status value
	var newStatus string
	switch action {
	case "call":
		newStatus = "processing"
	case "skip":
		newStatus = "cancelled"
	default:
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid action. Use 'call' or 'skip'")
		return
	}

	result, err := h.appointmentRepo.UpdateAppointmentStatus(id, newStatus)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, result)
}

// FinishQueue handles POST /api/admin/queue/{id}/finish
// Memperbarui status konsultasi pasien (Done/RawatInap/RawatJalan/RujukanSpesialis)
// dan mengembalikan URL WhatsApp untuk menghubungi keluarga pasien & dokter yang bertugas.
func (h *AdminHandler) FinishQueue(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, _, err := parseQueuePath(r.URL.Path)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Gagal membaca request body")
		return
	}
	defer r.Body.Close()

	var req request.FinishQueueRequest
	if err := json.Unmarshal(body, &req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Format JSON tidak valid: "+err.Error())
		return
	}

	// Validasi outcome
	validOutcomes := map[string]bool{
		"Done": true, "RawatInap": true, "RawatJalan": true, "RujukanSpesialis": true,
	}
	if !validOutcomes[req.Outcome] {
		utils.ErrorResponse(w, http.StatusBadRequest, "outcome tidak valid. Gunakan: Done, RawatInap, RawatJalan, atau RujukanSpesialis")
		return
	}

	// Validasi: nomor WA keluarga wajib diisi untuk RawatInap dan RawatJalan
	if (req.Outcome == "RawatInap" || req.Outcome == "RawatJalan") && req.FamilyPhoneNumber == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Nomor WhatsApp keluarga pasien wajib diisi untuk tindak lanjut Rawat Inap atau Rawat Jalan")
		return
	}

	result, err := h.appointmentRepo.FinishAppointmentConsultation(
		id,
		req.Outcome,
		req.FamilyPhoneNumber,
		req.FamilyName,
		req.OutcomeNotes,
		req.MedicalRecordNo,
	)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal memperbarui status konsultasi: "+err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, result)
}

// --- Private helpers ---

// setAuthCookies sets the httpOnly session cookies (access + refresh) on the
// response. Must be called before the response body/headers are written.
// SameSite=Lax is safe here: all web traffic reaches the backend through the
// same-origin Next.js proxy, and the browser extension uses Bearer headers.
func setAuthCookies(w http.ResponseWriter, r *http.Request, accessToken, refreshToken string) {
	secure := r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.CookieAccessToken,
		Value:    accessToken,
		Path:     "/",
		MaxAge:   service.AccessTokenExpirySecs(),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.CookieRefreshToken,
		Value:    refreshToken,
		Path:     "/",
		MaxAge:   int(service.RefreshTokenExpiry().Seconds()),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
	})
}

// clearAuthCookies expires the auth cookies.
func clearAuthCookies(w http.ResponseWriter) {
	for _, name := range []string{middleware.CookieAccessToken, middleware.CookieRefreshToken} {
		http.SetCookie(w, &http.Cookie{
			Name:     name,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})
	}
}

// cookieValue returns the value of the named request cookie, or "" if absent.
func cookieValue(r *http.Request, name string) string {
	c, err := r.Cookie(name)
	if err != nil {
		return ""
	}
	return c.Value
}


// parseQueuePath extracts the ID and action from a URL path: /api/admin/queue/{id}/{action}.
func parseQueuePath(path string) (int, string, error) {
	path = strings.TrimSuffix(path, "/")
	parts := strings.Split(path, "/")
	// Expected: ["", "api", "admin", "queue", "{id}", "{action}"]
	if len(parts) < 6 {
		return 0, "", fmt.Errorf("invalid URL path")
	}

	idStr := parts[len(parts)-2]
	action := parts[len(parts)-1]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, "", fmt.Errorf("invalid appointment ID: %s", idStr)
	}
	if id <= 0 {
		return 0, "", fmt.Errorf("appointment ID must be greater than 0")
	}

	return id, action, nil
}

// extractClientIP retrieves the real client IP address from request headers.
func extractClientIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		return ip[:idx]
	}
	return ip
}
