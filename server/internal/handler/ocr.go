package handler

import (
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// OCRHandler handles HTTP requests for OCR document extraction.
type OCRHandler struct {
	ocrSvc *service.OCRService
}

// NewOCRHandler creates a new OCRHandler instance.
func NewOCRHandler(ocrSvc *service.OCRService) *OCRHandler {
	return &OCRHandler{
		ocrSvc: ocrSvc,
	}
}

// Extract handles POST /api/ocr/extract and POST /api/admin/ocr/extract
// Parses the uploaded image file and doc_type, forwards to the OCR microservice.
func (h *OCRHandler) Extract(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Max 15MB file upload limit
	if err := r.ParseMultipartForm(15 << 20); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Failed to parse multipart form data")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Form file 'file' is required")
		return
	}
	defer file.Close()

	docType := r.FormValue("doc_type")
	if docType == "" {
		docType = "generic"
	}

	result, err := h.ocrSvc.Extract(header, docType)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadGateway, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, result, "OCR extraction successful")
}
