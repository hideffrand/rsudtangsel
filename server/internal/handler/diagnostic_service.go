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

// DiagnosticServiceHandler handles HTTP requests for diagnostic service CRUD.
type DiagnosticServiceHandler struct {
	service *service.DiagnosticServiceService
}

// NewDiagnosticServiceHandler creates a new DiagnosticServiceHandler.
func NewDiagnosticServiceHandler(svc *service.DiagnosticServiceService) *DiagnosticServiceHandler {
	return &DiagnosticServiceHandler{service: svc}
}

// Collection handles GET/POST /api/diagnostic-services.
func (h *DiagnosticServiceHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item handles GET/PUT/DELETE /api/diagnostic-services/{id}.
func (h *DiagnosticServiceHandler) Item(w http.ResponseWriter, r *http.Request) {
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

// list handles GET /api/diagnostic-services?category=lab|radiologi.
func (h *DiagnosticServiceHandler) list(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")
	services, err := h.service.GetAllServices(category)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, services)
}

func (h *DiagnosticServiceHandler) getOne(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	svc, err := h.service.GetService(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if svc == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "diagnostic service not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, svc)
}

func (h *DiagnosticServiceHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.DiagnosticServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := validateDiagnosticService(req); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	svc, err := h.service.CreateService(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, svc)
}

func (h *DiagnosticServiceHandler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.DiagnosticServiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := validateDiagnosticService(req); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	svc, err := h.service.UpdateService(id, req)
	if err != nil {
		if errors.Is(err, service.ErrDiagnosticServiceNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, svc)
}

func (h *DiagnosticServiceHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeleteService(id); err != nil {
		if errors.Is(err, service.ErrDiagnosticServiceNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, nil, "diagnostic service deleted")
}

func (h *DiagnosticServiceHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid diagnostic service id")
		return 0, false
	}
	return id, true
}

// validateDiagnosticService validates required fields and category value.
func validateDiagnosticService(req request.DiagnosticServiceRequest) string {
	if req.Category != "lab" && req.Category != "radiologi" {
		return "category must be 'lab' or 'radiologi'"
	}
	if req.Name == "" {
		return "name is required"
	}
	if req.Price < 0 {
		return "price must be >= 0"
	}
	return ""
}
