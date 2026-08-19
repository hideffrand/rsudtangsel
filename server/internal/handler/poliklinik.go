package handler

import (
	"net/http"
	"strconv"

	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// PoliklinikHandler menangani HTTP request untuk data master poliklinik (poli).
type PoliklinikHandler struct {
	service *service.PoliklinikService
}

// NewPoliklinikHandler membuat instance PoliklinikHandler baru.
func NewPoliklinikHandler(svc *service.PoliklinikService) *PoliklinikHandler {
	return &PoliklinikHandler{service: svc}
}

// Collection menangani GET /api/poli.
func (h *PoliklinikHandler) Collection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	polis, err := h.service.GetAllPolis()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, polis)
}

// Item menangani GET /api/poli/{id}.
func (h *PoliklinikHandler) Item(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid poli id")
		return
	}

	poli, err := h.service.GetPoli(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if poli == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "poliklinik not found")
		return
	}

	utils.SuccessResponse(w, http.StatusOK, poli)
}
