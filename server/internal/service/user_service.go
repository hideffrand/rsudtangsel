package service

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"golang.org/x/crypto/bcrypt"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrUserNotFound is returned when a user does not exist.
var ErrUserNotFound = errors.New("user not found")

var emailRegex = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// UserService handles business logic for admin user management (CRUD akun staff).
type UserService struct {
	repo *repository.UserRepository
}

// NewUserService creates a new UserService instance.
func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// GetAllUsers returns all users (public representation, no password hash).
func (s *UserService) GetAllUsers() ([]response.AdminUserResponse, error) {
	users, err := s.repo.FindAllUsers()
	if err != nil {
		return nil, err
	}
	list := make([]response.AdminUserResponse, len(users))
	for i, u := range users {
		list[i] = toAdminUserResponse(u)
	}
	return list, nil
}

// GetUser returns a single user, or nil if not found.
func (s *UserService) GetUser(id int) (*response.AdminUserResponse, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}
	resp := toAdminUserResponse(*user)
	return &resp, nil
}

// CreateUser registers a new user account with a bcrypt-hashed password.
func (s *UserService) CreateUser(req request.UserCreateRequest) (*response.AdminUserResponse, error) {
	if !emailRegex.MatchString(req.Email) {
		return nil, fmt.Errorf("format email tidak valid")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	id, err := s.repo.CreateUser(&model.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hash),
		Role:         req.Role,
		IsActive:     isActive,
	})
	if err != nil {
		if strings.Contains(err.Error(), "users_username_key") {
			return nil, fmt.Errorf("username sudah digunakan")
		}
		if strings.Contains(err.Error(), "users_email_key") {
			return nil, fmt.Errorf("email sudah digunakan")
		}
		return nil, err
	}

	return s.GetUser(id)
}

// UpdateUser applies partial updates. Password is re-hashed only when provided.
func (s *UserService) UpdateUser(id int, req request.UserUpdateRequest) (*response.AdminUserResponse, error) {
	if req.Email != nil && !emailRegex.MatchString(*req.Email) {
		return nil, fmt.Errorf("format email tidak valid")
	}

	var hash *string
	if req.Password != nil && *req.Password != "" {
		h, err := bcrypt.GenerateFromPassword([]byte(*req.Password), 10)
		if err != nil {
			return nil, fmt.Errorf("hash password: %w", err)
		}
		s := string(h)
		hash = &s
	}

	updated, err := s.repo.UpdateUser(id, req.Email, hash, req.Role, req.IsActive)
	if err != nil {
		if strings.Contains(err.Error(), "users_email_key") {
			return nil, fmt.Errorf("email sudah digunakan")
		}
		return nil, err
	}
	if !updated {
		return nil, ErrUserNotFound
	}

	return s.GetUser(id)
}

// DeleteUser removes a user account (and its refresh tokens).
func (s *UserService) DeleteUser(id int) error {
	deleted, err := s.repo.DeleteUser(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrUserNotFound
	}
	return nil
}

// toAdminUserResponse maps the model to its public representation and derives a
// readable browser name from the stored User-Agent of the last login.
func toAdminUserResponse(u model.User) response.AdminUserResponse {
	resp := response.AdminUserResponse{
		ID:               u.ID,
		Username:         u.Username,
		Email:            u.Email,
		Role:             u.Role,
		IsActive:         u.IsActive,
		LastLoginIP:      u.LastLoginIP,
		LastLoginBrowser: parseBrowserName(u.LastLoginUA),
	}
	if u.LastLogin != nil {
		resp.LastLogin = u.LastLogin.Format("2006-01-02 15:04:05")
	}
	resp.CreatedAt = u.CreatedAt.Format("2006-01-02 15:04:05")
	return resp
}

// parseBrowserName extracts a human-readable browser name from a User-Agent header.
func parseBrowserName(ua string) string {
	switch {
	case ua == "":
		return ""
	case strings.Contains(ua, "Edg/"):
		return "Edge"
	case strings.Contains(ua, "OPR/") || strings.Contains(ua, "Opera"):
		return "Opera"
	case strings.Contains(ua, "Firefox"):
		return "Firefox"
	case strings.Contains(ua, "Chrome") || strings.Contains(ua, "Chromium"):
		return "Chrome"
	case strings.Contains(ua, "Safari"):
		return "Safari"
	default:
		return "Lainnya"
	}
}
