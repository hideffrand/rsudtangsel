package handler

import (
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// AntrianHandler menangani HTTP request untuk cek antrian.
type AntrianHandler struct {
	service *service.AntrianService
}

// NewAntrianHandler membuat instance AntrianHandler baru.
func NewAntrianHandler(svc *service.AntrianService) *AntrianHandler {
	return &AntrianHandler{service: svc}
}

// Handle menangani GET /api/antrian?poli=...&tanggal=...
func (h *AntrianHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	poli := r.URL.Query().Get("poli")
	if poli == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Query parameter 'poli' wajib diisi")
		return
	}

	// tanggal opsional — default ke hari ini di service
	tanggal := r.URL.Query().Get("tanggal")

	items, err := h.service.CekAntrian(poli, tanggal)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, items)
}
