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

// UserHandler handles HTTP requests for admin user management (CRUD akun staff).
type UserHandler struct {
	service *service.UserService
}

// NewUserHandler creates a new UserHandler instance.
func NewUserHandler(svc *service.UserService) *UserHandler {
	return &UserHandler{service: svc}
}

// Collection handles GET/POST /api/admin/users.
func (h *UserHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		utils.ErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// Item handles GET/PUT/DELETE /api/admin/users/{id}.
func (h *UserHandler) Item(w http.ResponseWriter, r *http.Request) {
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

func (h *UserHandler) list(w http.ResponseWriter, r *http.Request) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, users)
}

func (h *UserHandler) getOne(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	user, err := h.service.GetUser(id)
	if err != nil {
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	if user == nil {
		utils.ErrorResponse(w, http.StatusNotFound, "user not found")
		return
	}
	utils.SuccessResponse(w, http.StatusOK, user)
}

func (h *UserHandler) create(w http.ResponseWriter, r *http.Request) {
	var req request.UserCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := req.Validate(); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	user, err := h.service.CreateUser(req)
	if err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusCreated, user)
}

func (h *UserHandler) update(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	var req request.UserUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if errMsg := req.Validate(); errMsg != "" {
		utils.ErrorResponse(w, http.StatusBadRequest, errMsg)
		return
	}

	user, err := h.service.UpdateUser(id, req)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, user)
}

func (h *UserHandler) delete(w http.ResponseWriter, r *http.Request) {
	id, ok := h.parseID(w, r)
	if !ok {
		return
	}

	if err := h.service.DeleteUser(id); err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			utils.ErrorResponse(w, http.StatusNotFound, err.Error())
			return
		}
		utils.ErrorResponse(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(w, http.StatusOK, nil, "user deleted")
}

func (h *UserHandler) parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		utils.ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return 0, false
	}
	return id, true
}
