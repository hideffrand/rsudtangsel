package service

import (
	"errors"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrMcuPackageNotFound is returned when an MCU package does not exist.
var ErrMcuPackageNotFound = errors.New("mcu package not found")

// McuPackageService handles business logic for MCU packages.
type McuPackageService struct {
	repo *repository.McuPackageRepository
}

// NewMcuPackageService creates a new McuPackageService.
func NewMcuPackageService(repo *repository.McuPackageRepository) *McuPackageService {
	return &McuPackageService{repo: repo}
}

// CreatePackage creates a new MCU package.
func (s *McuPackageService) CreatePackage(req request.McuPackageRequest) (*response.McuPackageResponse, error) {
	p := &model.McuPackage{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		IsActive:    true,
		Items:       toMcuItemModels(req.Items),
	}
	if req.IsActive != nil {
		p.IsActive = *req.IsActive
	}

	id, err := s.repo.Create(p)
	if err != nil {
		return nil, err
	}
	return s.GetPackage(id)
}

// GetAllPackages returns all MCU packages with their items.
func (s *McuPackageService) GetAllPackages() ([]response.McuPackageResponse, error) {
	packages, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	list := make([]response.McuPackageResponse, len(packages))
	for i, p := range packages {
		list[i] = toMcuPackageResponse(p)
	}
	return list, nil
}

// GetPackage returns a single MCU package. Returns nil if not found.
func (s *McuPackageService) GetPackage(id int) (*response.McuPackageResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, nil
	}
	resp := toMcuPackageResponse(*p)
	return &resp, nil
}

// UpdatePackage updates an MCU package (replaces its items).
func (s *McuPackageService) UpdatePackage(id int, req request.McuPackageRequest) (*response.McuPackageResponse, error) {
	p := &model.McuPackage{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		IsActive:    true,
		Items:       toMcuItemModels(req.Items),
	}
	if req.IsActive != nil {
		p.IsActive = *req.IsActive
	}

	updated, err := s.repo.Update(p)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrMcuPackageNotFound
	}
	return s.GetPackage(id)
}

// DeletePackage deletes an MCU package.
func (s *McuPackageService) DeletePackage(id int) error {
	deleted, err := s.repo.Delete(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrMcuPackageNotFound
	}
	return nil
}

func toMcuItemModels(items []request.McuPackageItemRequest) []model.McuPackageItem {
	out := make([]model.McuPackageItem, len(items))
	for i, it := range items {
		out[i] = model.McuPackageItem{Name: it.Name, Description: it.Description}
	}
	return out
}

func toMcuPackageResponse(p model.McuPackage) response.McuPackageResponse {
	items := make([]response.McuPackageItemResponse, 0, len(p.Items))
	for _, it := range p.Items {
		items = append(items, response.McuPackageItemResponse{
			ID:          it.ID,
			Name:        it.Name,
			Description: it.Description,
		})
	}
	return response.McuPackageResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		IsActive:    p.IsActive,
		Items:       items,
	}
}
