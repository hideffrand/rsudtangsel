package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// MedicalPackageBookingHandler handles HTTP requests for medical package booking endpoints.
type MedicalPackageBookingHandler struct {
	svc *service.MedicalPackageBookingService
}

// NewMedicalPackageBookingHandler creates a new MedicalPackageBookingHandler.
func NewMedicalPackageBookingHandler(svc *service.MedicalPackageBookingService) *MedicalPackageBookingHandler {
	return &MedicalPackageBookingHandler{svc: svc}
}

// ======================== Public Endpoints ========================

// Register handles POST /api/mcu/register
// Allows any patient to book an appointment without authentication.
func (h *MedicalPackageBookingHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.MedicalPackageBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if errMsg := req.Validate(); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	booking, err := h.svc.Register(req)
	if err != nil {
		if errors.Is(err, service.ErrMedicalPackageBookingPkgNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, booking, "Booking registered successfully")
}

// GetMyBookings handles GET /api/package-bookings/my-bookings?nik=<NIK>
// Returns all bookings for the patient identified by their NIK.
func (h *MedicalPackageBookingHandler) GetMyBookings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	nik := r.URL.Query().Get("nik")
	if nik == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "query parameter 'nik' is required")
		return
	}
	if len(nik) != 16 {
		utils.ErrorResponse(w, http.StatusBadRequest, "nik must be exactly 16 digits")
		return
	}

	bookings, err := h.svc.GetPatientBookings(nik)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, bookings)
}

// ======================== Admin Endpoints ========================

// AdminListBookings handles GET /api/admin/package-bookings
// Query params: status (optional), date (optional, YYYY-MM-DD)
func (h *MedicalPackageBookingHandler) AdminListBookings(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	status := r.URL.Query().Get("status")
	date := r.URL.Query().Get("date")

	bookings, err := h.svc.AdminGetBookings(status, date)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, bookings)
}

// AdminGetBooking handles GET /api/admin/package-bookings/{id}
func (h *MedicalPackageBookingHandler) AdminGetBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	booking, err := h.svc.GetBooking(id)
	if err != nil {
		if errors.Is(err, service.ErrMedicalPackageBookingNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, booking)
}

// AdminUpdateBooking handles PATCH /api/admin/package-bookings/{id}
// Allows partial update of status and/or notes.
func (h *MedicalPackageBookingHandler) AdminUpdateBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.MedicalPackageBookingAdminUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updated, err := h.svc.AdminUpdateBooking(id, req)
	if err != nil {
		if errors.Is(err, service.ErrMedicalPackageBookingNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, updated, "Booking updated")
}

// AdminConfirmBooking handles PATCH /api/admin/package-bookings/{id}/confirm
// Shortcut to set status = "confirmed".
func (h *MedicalPackageBookingHandler) AdminConfirmBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	status := "confirmed"
	updated, err := h.svc.AdminUpdateBooking(id, request.MedicalPackageBookingAdminUpdateRequest{Status: &status})
	if err != nil {
		if errors.Is(err, service.ErrMedicalPackageBookingNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, updated, "Booking confirmed")
}

// AdminCancelBooking handles PATCH /api/admin/package-bookings/{id}/cancel
// Shortcut to set status = "cancelled".
func (h *MedicalPackageBookingHandler) AdminCancelBooking(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	status := "cancelled"
	updated, err := h.svc.AdminUpdateBooking(id, request.MedicalPackageBookingAdminUpdateRequest{Status: &status})
	if err != nil {
		if errors.Is(err, service.ErrMedicalPackageBookingNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, updated, "Booking cancelled")
}

// --- private helper ---

// parseID extracts and validates the {id} path value from the URL.
func (h *MedicalPackageBookingHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid booking id")
		return 0, false
	}
	return id, true
}
