package service

import (
	"errors"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrDiagnosticServiceNotFound is returned when a diagnostic service does not exist.
var ErrDiagnosticServiceNotFound = errors.New("diagnostic service not found")

// DiagnosticServiceService handles business logic for diagnostic services (Lab/Radiologi).
type DiagnosticServiceService struct {
	repo *repository.DiagnosticServiceRepository
}

// NewDiagnosticServiceService creates a new DiagnosticServiceService.
func NewDiagnosticServiceService(repo *repository.DiagnosticServiceRepository) *DiagnosticServiceService {
	return &DiagnosticServiceService{repo: repo}
}

// CreateService creates a new diagnostic service.
func (s *DiagnosticServiceService) CreateService(req request.DiagnosticServiceRequest) (*response.DiagnosticServiceResponse, error) {
	service := &model.DiagnosticService{
		Category:    req.Category,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		IsActive:    true,
		Items:       toDiagnosticItemModels(req.Items),
	}
	if req.IsActive != nil {
		service.IsActive = *req.IsActive
	}

	id, err := s.repo.Create(service)
	if err != nil {
		return nil, err
	}
	return s.GetService(id)
}

// GetAllServices returns all diagnostic services with their items, optionally filtered by category.
func (s *DiagnosticServiceService) GetAllServices(category string) ([]response.DiagnosticServiceResponse, error) {
	services, err := s.repo.FindAll(category)
	if err != nil {
		return nil, err
	}
	list := make([]response.DiagnosticServiceResponse, len(services))
	for i, svc := range services {
		list[i] = toDiagnosticServiceResponse(svc)
	}
	return list, nil
}

// GetService returns a single diagnostic service. Returns nil if not found.
func (s *DiagnosticServiceService) GetService(id int) (*response.DiagnosticServiceResponse, error) {
	svc, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if svc == nil {
		return nil, nil
	}
	resp := toDiagnosticServiceResponse(*svc)
	return &resp, nil
}

// UpdateService updates a diagnostic service (replaces its items).
func (s *DiagnosticServiceService) UpdateService(id int, req request.DiagnosticServiceRequest) (*response.DiagnosticServiceResponse, error) {
	service := &model.DiagnosticService{
		ID:          id,
		Category:    req.Category,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		IsActive:    true,
		Items:       toDiagnosticItemModels(req.Items),
	}
	if req.IsActive != nil {
		service.IsActive = *req.IsActive
	}

	updated, err := s.repo.Update(service)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrDiagnosticServiceNotFound
	}
	return s.GetService(id)
}

// DeleteService deletes a diagnostic service.
func (s *DiagnosticServiceService) DeleteService(id int) error {
	deleted, err := s.repo.Delete(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrDiagnosticServiceNotFound
	}
	return nil
}

func toDiagnosticItemModels(items []request.DiagnosticServiceItemRequest) []model.DiagnosticServiceItem {
	out := make([]model.DiagnosticServiceItem, len(items))
	for i, it := range items {
		out[i] = model.DiagnosticServiceItem{Name: it.Name, Description: it.Description}
	}
	return out
}

func toDiagnosticServiceResponse(s model.DiagnosticService) response.DiagnosticServiceResponse {
	items := make([]response.DiagnosticServiceItemResponse, 0, len(s.Items))
	for _, it := range s.Items {
		items = append(items, response.DiagnosticServiceItemResponse{
			ID:          it.ID,
			Name:        it.Name,
			Description: it.Description,
		})
	}
	return response.DiagnosticServiceResponse{
		ID:          s.ID,
		Category:    s.Category,
		Name:        s.Name,
		Description: s.Description,
		Price:       s.Price,
		IsActive:    s.IsActive,
		Items:       items,
	}
}
