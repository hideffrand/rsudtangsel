package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// RegistrationHandler handles HTTP requests for online registration.
type RegistrationHandler struct {
	service *service.AntrianService
}

// NewRegistrationHandler creates a new RegistrationHandler instance.
func NewRegistrationHandler(svc *service.AntrianService) *RegistrationHandler {
	return &RegistrationHandler{service: svc}
}

// Handle handles POST /api/daftar-online.
func (h *RegistrationHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.DaftarOnlineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate required fields
	if req.NIK == "" || req.Name == "" || req.PhoneNumber == "" || req.ScheduleDate == "" || req.DoctorID <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "nik, name, phone_number, doctor_id, and schedule_date are required")
		return
	}

	result, err := h.service.DaftarOnline(req)
	if err != nil {
		if errors.Is(err, service.ErrDoctorNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, result)
}
