package handler

import (
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// QueueHandler menangani HTTP request untuk cek antrian.
type QueueHandler struct {
	service *service.QueueService
}

// NewQueueHandler membuat instance QueueHandler baru.
func NewQueueHandler(svc *service.QueueService) *QueueHandler {
	return &QueueHandler{service: svc}
}

// Handle handles GET /api/queue?department=...&date=...
func (h *QueueHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	department := r.URL.Query().Get("department")
	if department == "" {
		utils.ErrorResponse(w, http.StatusBadRequest, "Query parameter 'department' wajib diisi")
		return
	}

	// date opsional — default ke hari ini di service
	date := r.URL.Query().Get("date")

	items, err := h.service.GetQueue(department, date)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(w, http.StatusOK, items)
}
