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

// DoctorHandler menangani HTTP request untuk CRUD master data dokter dan jadwal dokter.
type DoctorHandler struct {
	service *service.DoctorService
}

// NewDoctorHandler membuat instance DoctorHandler baru.
func NewDoctorHandler(svc *service.DoctorService) *DoctorHandler {
	return &DoctorHandler{service: svc}
}

// Collection menangani GET/POST /api/doctors.
func (h *DoctorHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item menangani GET/PUT/DELETE /api/doctors/{id}.
func (h *DoctorHandler) Item(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getOne(w, r)
	case http.MethodPut:
		h.update(w, r)
	case http.MethodDelete:
		h.delete(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func (h *DoctorHandler) list(w http.ResponseWriter, r *http.Request) {
	doctors, err := h.service.GetAllDoctors()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, doctors)
}

func (h *DoctorHandler) getOne(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	doctor, err := h.service.GetDoctor(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if doctor == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "doctor not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, doctor)
}

func (h *DoctorHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.DoctorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" || req.Specialty == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "name dan specialty wajib diisi")
		return
	}

	doctor, err := h.service.CreateDoctor(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, doctor)
}

func (h *DoctorHandler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.DoctorRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" || req.Specialty == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "name dan specialty wajib diisi")
		return
	}

	doctor, err := h.service.UpdateDoctor(id, req)
	if err != nil {
		if errors.Is(err, service.ErrDoctorNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, doctor)
}

func (h *DoctorHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeleteDoctor(id); err != nil {
		if errors.Is(err, service.ErrDoctorNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, nil, "doctor deleted")
}

// DoctorSchedules menangani GET /api/doctors/{id}/schedules.
func (h *DoctorHandler) DoctorSchedules(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid doctor id")
		return
	}

	schedules, err := h.service.GetDoctorSchedules(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if schedules == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "doctor not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, schedules)
}

func (h *DoctorHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid doctor id")
		return 0, false
	}
	return id, true
}
