package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// MedicalPackageHandler handles HTTP requests for the medical package catalog
// (MCU, Lab, Radiologi) CRUD.
type MedicalPackageHandler struct {
	service *service.MedicalPackageService
}

// NewMedicalPackageHandler creates a new MedicalPackageHandler.
func NewMedicalPackageHandler(svc *service.MedicalPackageService) *MedicalPackageHandler {
	return &MedicalPackageHandler{service: svc}
}

// Collection handles GET/POST /api/medical-packages.
// GET accepts an optional ?type= filter ('mcu' | 'lab' | 'radiologi').
func (h *MedicalPackageHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item handles GET/PUT/DELETE /api/medical-packages/{id}.
func (h *MedicalPackageHandler) Item(w http.ResponseWriter, r *http.Request) {
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

func (h *MedicalPackageHandler) list(w http.ResponseWriter, r *http.Request) {
	packageType := r.URL.Query().Get("type")
	if packageType != "" && !model.IsValidMedicalPackageType(packageType) {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid type. Use: mcu, lab, or radiologi")
		return
	}

	packages, err := h.service.GetAllPackages(packageType)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, packages)
}

func (h *MedicalPackageHandler) getOne(w http.ResponseWriter, r *http.Request) {
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
		utils.ErrorResponse(w, http.StatusNotFound, "medical package not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, packageResp)
}

func (h *MedicalPackageHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.MedicalPackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := validateMedicalPackage(req); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	packageResp, err := h.service.CreatePackage(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusCreated, packageResp)
}

func (h *MedicalPackageHandler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.MedicalPackageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := validateMedicalPackage(req); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	packageResp, err := h.service.UpdatePackage(id, req)
	if err != nil {
		if errors.Is(err, service.ErrMedicalPackageNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, packageResp)
}

func (h *MedicalPackageHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeletePackage(id); err != nil {
		if errors.Is(err, service.ErrMedicalPackageNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, nil, "medical package deleted")
}

func (h *MedicalPackageHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid medical package id")
		return 0, false
	}
	return id, true
}

func validateMedicalPackage(req request.MedicalPackageRequest) string {
	if !model.IsValidMedicalPackageType(req.Type) {
		return "type is required and must be one of: mcu, lab, radiologi"
	}
	if req.Name == "" || req.Price < 0 {
		return "name is required and price must be >= 0"
	}
	return ""
}
