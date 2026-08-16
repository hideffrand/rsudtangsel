package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// DaftarOnlineHandler menangani HTTP request untuk pendaftaran online.
type DaftarOnlineHandler struct {
	service *service.AntrianService
}

// NewDaftarOnlineHandler membuat instance DaftarOnlineHandler baru.
func NewDaftarOnlineHandler(svc *service.AntrianService) *DaftarOnlineHandler {
	return &DaftarOnlineHandler{service: svc}
}

// Handle menangani POST /api/daftar-online.
func (h *DaftarOnlineHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req request.DaftarOnlineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validasi field wajib
	if req.NIK == "" || req.Nama == "" || req.NoHP == "" || req.Poli == "" || req.Tanggal == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "NIK, Nama, No HP, Poli, dan Tanggal wajib diisi")
		return
	}

	result, err := h.service.DaftarOnline(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, result)
}
