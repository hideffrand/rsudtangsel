package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// OCRDocumentTypeHandler handles HTTP requests for OCR document type CRUD.
type OCRDocumentTypeHandler struct {
	service *service.OCRDocumentTypeService
}

// NewOCRDocumentTypeHandler creates a new OCRDocumentTypeHandler.
func NewOCRDocumentTypeHandler(svc *service.OCRDocumentTypeService) *OCRDocumentTypeHandler {
	return &OCRDocumentTypeHandler{service: svc}
}

// Collection handles GET/POST /api/admin/ocr-document-types.
func (h *OCRDocumentTypeHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item handles GET/PUT/DELETE /api/admin/ocr-document-types/{id}.
func (h *OCRDocumentTypeHandler) Item(w http.ResponseWriter, r *http.Request) {
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

// list handles GET /api/admin/ocr-document-types.
func (h *OCRDocumentTypeHandler) list(w http.ResponseWriter, r *http.Request) {
	items, err := h.service.GetAllOCRDocumentTypes()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, items)
}

// getOne handles GET /api/admin/ocr-document-types/{id}.
func (h *OCRDocumentTypeHandler) getOne(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid OCR document type id")
		return
	}

	item, err := h.service.GetOCRDocumentType(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if item == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "OCR document type not found")
		return
	}
	utils.SuccessResponse(w, http.StatusOK, item)
}

// create handles POST /api/admin/ocr-document-types.
func (h *OCRDocumentTypeHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.OCRDocumentTypeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := validateOCRDocumentType(req, true); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	item, err := h.service.CreateOCRDocumentType(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusCreated, item)
}

// update handles PUT /api/admin/ocr-document-types/{id}.
func (h *OCRDocumentTypeHandler) update(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid OCR document type id")
		return
	}

	var req request.OCRDocumentTypeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := validateOCRDocumentType(req, false); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	item, err := h.service.UpdateOCRDocumentType(id, req)
	if err != nil {
		if errors.Is(err, service.ErrOCRDocumentTypeNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, item)
}

// delete handles DELETE /api/admin/ocr-document-types/{id}.
func (h *OCRDocumentTypeHandler) delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid OCR document type id")
		return
	}

	if err := h.service.DeleteOCRDocumentType(id); err != nil {
		if errors.Is(err, service.ErrOCRDocumentTypeNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, nil, "OCR document type deleted")
}

// validateOCRDocumentType validates required fields. id is required only on create
// (it is taken from the URL path on update).
func validateOCRDocumentType(req request.OCRDocumentTypeRequest, isCreate bool) string {
	if isCreate && req.ID == "" {
		return "id is required"
	}
	if req.Name == "" {
		return "name is required"
	}
	return ""
}
