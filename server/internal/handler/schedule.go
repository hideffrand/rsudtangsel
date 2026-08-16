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

// ScheduleHandler menangani HTTP request untuk CRUD jadwal dokter.
type ScheduleHandler struct {
	service *service.DoctorService
}

// NewScheduleHandler membuat instance ScheduleHandler baru.
func NewScheduleHandler(svc *service.DoctorService) *ScheduleHandler {
	return &ScheduleHandler{service: svc}
}

// Collection menangani GET/POST /api/schedules.
func (h *ScheduleHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item menangani GET/PUT/DELETE /api/schedules/{id}.
func (h *ScheduleHandler) Item(w http.ResponseWriter, r *http.Request) {
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

func (h *ScheduleHandler) list(w http.ResponseWriter, r *http.Request) {
	doctorID := 0
	if v := r.URL.Query().Get("doctor_id"); v != "" {
		id, err := strconv.Atoi(v)
		if err != nil || id <= 0 {
			utils.ErrorResponse(w, http.StatusBadRequest, "invalid doctor_id")
			return
		}
		doctorID = id
	}

	schedules, err := h.service.GetAllSchedules(doctorID)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, schedules)
}

func (h *ScheduleHandler) getOne(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	schedule, err := h.service.GetSchedule(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if schedule == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "schedule not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, schedule)
}

func (h *ScheduleHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.ScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if !validSchedule(req) {
		utils.ErrorResponse(w, http.StatusBadRequest, "doctor_id, day_of_week, dan start_time wajib diisi")
		return
	}

	schedule, err := h.service.CreateSchedule(req)
	if err != nil {
		if errors.Is(err, service.ErrDoctorNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, schedule)
}

func (h *ScheduleHandler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.ScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if !validSchedule(req) {
		utils.ErrorResponse(w, http.StatusBadRequest, "doctor_id, day_of_week, dan start_time wajib diisi")
		return
	}

	schedule, err := h.service.UpdateSchedule(id, req)
	if err != nil {
		if errors.Is(err, service.ErrScheduleNotFound) || errors.Is(err, service.ErrDoctorNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, schedule)
}

func (h *ScheduleHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeleteSchedule(id); err != nil {
		if errors.Is(err, service.ErrScheduleNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, nil, "schedule deleted")
}

func (h *ScheduleHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid schedule id")
		return 0, false
	}
	return id, true
}

func validSchedule(req request.ScheduleRequest) bool {
	return req.DoctorID > 0 && req.DayOfWeek != "" && req.StartTime != ""
}
