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

	utils.SuccessResponse(w, http.StatusOK, loginResp, "Login successful")
}

// RefreshToken handles POST /api/admin/refresh
// Rotates the refresh token and returns a new access token.
func (h *AdminHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
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

	utils.SuccessResponse(w, http.StatusOK, resp, "Token refreshed")
}

// Logout handles POST /api/admin/logout
// Deletes the refresh token from the database. This operation is idempotent.
func (h *AdminHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	_ = h.authSvc.Logout(req.RefreshToken)
	utils.SuccessResponse(w, http.StatusOK, nil, "Logged out successfully")
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

// --- Private helpers ---

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
