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

// McuPackageHandler handles HTTP requests for MCU package CRUD.
type McuPackageHandler struct {
	service *service.McuPackageService
}

// NewMcuPackageHandler creates a new McuPackageHandler.
func NewMcuPackageHandler(svc *service.McuPackageService) *McuPackageHandler {
	return &McuPackageHandler{service: svc}
}

// Collection handles GET/POST /api/mcu-packages.
func (h *McuPackageHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item handles GET/PUT/DELETE /api/mcu-packages/{id}.
func (h *McuPackageHandler) Item(w http.ResponseWriter, r *http.Request) {
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

func (h *McuPackageHandler) list(w http.ResponseWriter, r *http.Request) {
	packages, err := h.service.GetAllPackages()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, packages)
}

func (h *McuPackageHandler) getOne(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	packageResp, err := h.service.GetPackage(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if packageResp == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "mcu package not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, packageResp)
}

func (h *McuPackageHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.McuPackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" || req.Price < 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "name is required and price must be >= 0")
		return
	}

	packageResp, err := h.service.CreatePackage(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, packageResp)
}

func (h *McuPackageHandler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.McuPackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.Name == "" || req.Price < 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "name is required and price must be >= 0")
		return
	}

	packageResp, err := h.service.UpdatePackage(id, req)
	if err != nil {
		if errors.Is(err, service.ErrMcuPackageNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, packageResp)
}

func (h *McuPackageHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeletePackage(id); err != nil {
		if errors.Is(err, service.ErrMcuPackageNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, nil, "mcu package deleted")
}

func (h *McuPackageHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid mcu package id")
		return 0, false
	}
	return id, true
}
