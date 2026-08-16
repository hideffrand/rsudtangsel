package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// AdminHandler menangani semua HTTP request untuk endpoint admin.
type AdminHandler struct {
	authSvc         *service.AuthService
	dashboardSvc    *service.DashboardService
	appointmentRepo *repository.AppointmentRepository
}

// NewAdminHandler membuat instance AdminHandler baru.
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

// Login menangani POST /api/admin/login
// Memvalidasi kredensial dan mengembalikan JWT token.
func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Request body tidak valid")
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
			utils.ErrorResponse(w, http.StatusUnauthorized, "Username atau password salah")
			return
		}
		utils.ErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, loginResp, "Login berhasil")
}

// RefreshToken menangani POST /api/admin/refresh
// Merotasi refresh token dan mengembalikan access token baru.
func (h *AdminHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	if errMsg := req.Validate(); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	resp, err := h.authSvc.RefreshToken(req.RefreshToken)
	if err != nil {
		utils.ErrorResponse(w, http.StatusUnauthorized, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, resp, "Token diperbarui")
}

// Logout menangani POST /api/admin/logout
// Menghapus refresh token dari database (idempotent).
func (h *AdminHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Request body tidak valid")
		return
	}

	_ = h.authSvc.Logout(req.RefreshToken)
	utils.SuccessResponse(w, http.StatusOK, nil, "Logout berhasil")
}

// DashboardStats menangani GET /api/admin/dashboard/stats
// Mengembalikan statistik dashboard hari ini.
func (h *AdminHandler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	stats, err := h.dashboardSvc.GetStats()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal mengambil statistik: "+err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, stats)
}

// AdminAntrian menangani GET /api/admin/antrian
// Mengembalikan daftar antrian lengkap dengan data pasien dan dokter.
// Query params: poli (specialty), tanggal (date)
func (h *AdminHandler) AdminAntrian(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// "poli" query param digunakan sebagai specialty filter
	specialty := r.URL.Query().Get("poli")
	date := r.URL.Query().Get("tanggal")
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
		utils.ErrorResponse(w, http.StatusInternalServerError, "Gagal mengambil antrian: "+err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, items)
}

// UpdateAntrianStatus menangani PATCH /api/admin/antrian/{id}/call atau /skip
// URL format: /api/admin/antrian/123/call atau /api/admin/antrian/123/skip
func (h *AdminHandler) UpdateAntrianStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, action, err := parseAntrianPath(r.URL.Path)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	// Tentukan status baru: "call" → processing, "skip" → cancelled
	var newStatus string
	switch action {
	case "call":
		newStatus = "processing"
	case "skip":
		newStatus = "cancelled"
	default:
		utils.ErrorResponse(w, http.StatusBadRequest, "Action tidak valid. Gunakan 'call' atau 'skip'")
		return
	}

	result, err := h.appointmentRepo.UpdateAppointmentStatus(id, newStatus)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, result)
}

// --- Private helpers ---

// parseAntrianPath mengurai ID dan action dari URL path /api/admin/antrian/{id}/{action}.
func parseAntrianPath(path string) (int, string, error) {
	path = strings.TrimSuffix(path, "/")
	parts := strings.Split(path, "/")
	// Expected: ["", "api", "admin", "antrian", "{id}", "{action}"]
	if len(parts) < 6 {
		return 0, "", fmt.Errorf("URL tidak valid")
	}

	idStr := parts[len(parts)-2]
	action := parts[len(parts)-1]

	id, err := strconv.Atoi(idStr)
	if err != nil {
		return 0, "", fmt.Errorf("ID antrian tidak valid: %s", idStr)
	}
	if id <= 0 {
		return 0, "", fmt.Errorf("ID antrian harus lebih dari 0")
	}

	return id, action, nil
}

// extractClientIP mengambil IP address dari request headers.
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
