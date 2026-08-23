package service

import (
	"errors"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrMedicalPackageNotFound is returned when a medical package does not exist.
var ErrMedicalPackageNotFound = errors.New("medical package not found")

// MedicalPackageService handles business logic for the medical package catalog
// (MCU, Lab, dan Radiologi dalam satu tabel medical_packages).
type MedicalPackageService struct {
	repo *repository.MedicalPackageRepository
}

// NewMedicalPackageService creates a new MedicalPackageService.
func NewMedicalPackageService(repo *repository.MedicalPackageRepository) *MedicalPackageService {
	return &MedicalPackageService{repo: repo}
}

// CreatePackage creates a new medical package of the given type.
func (s *MedicalPackageService) CreatePackage(req request.MedicalPackageRequest) (*response.MedicalPackageResponse, error) {
	p := toMedicalPackageModel(req)
	id, err := s.repo.Create(p)
	if err != nil {
		return nil, err
	}
	return s.GetPackage(id)
}

// GetAllPackages returns packages with their items. When packageType is empty,
// all types are returned; otherwise only the matching type.
func (s *MedicalPackageService) GetAllPackages(packageType string) ([]response.MedicalPackageResponse, error) {
	packages, err := s.repo.FindAll(packageType)
	if err != nil {
		return nil, err
	}
	list := make([]response.MedicalPackageResponse, len(packages))
	for i, p := range packages {
		list[i] = toMedicalPackageResponse(p)
	}
	return list, nil
}

// GetPackage returns a single medical package. Returns nil if not found.
func (s *MedicalPackageService) GetPackage(id int) (*response.MedicalPackageResponse, error) {
	p, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, nil
	}
	resp := toMedicalPackageResponse(*p)
	return &resp, nil
}

// UpdatePackage updates a medical package (replaces its items).
func (s *MedicalPackageService) UpdatePackage(id int, req request.MedicalPackageRequest) (*response.MedicalPackageResponse, error) {
	p := toMedicalPackageModel(req)
	p.ID = id

	updated, err := s.repo.Update(p)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrMedicalPackageNotFound
	}
	return s.GetPackage(id)
}

// DeletePackage deletes a medical package.
func (s *MedicalPackageService) DeletePackage(id int) error {
	deleted, err := s.repo.Delete(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrMedicalPackageNotFound
	}
	return nil
}

func toMedicalPackageModel(req request.MedicalPackageRequest) *model.MedicalPackage {
	items := make([]model.MedicalPackageItem, len(req.Items))
	for i, it := range req.Items {
		items[i] = model.MedicalPackageItem{Name: it.Name, Description: it.Description}
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	return &model.MedicalPackage{
		Type:        req.Type,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		IsActive:    isActive,
		Items:       items,
	}
}

func toMedicalPackageResponse(p model.MedicalPackage) response.MedicalPackageResponse {
	items := make([]response.MedicalPackageItemResponse, 0, len(p.Items))
	for _, it := range p.Items {
		items = append(items, response.MedicalPackageItemResponse{
			ID:          it.ID,
			Name:        it.Name,
			Description: it.Description,
		})
	}
	return response.MedicalPackageResponse{
		ID:          p.ID,
		Type:        p.Type,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		IsActive:    p.IsActive,
		Items:       items,
	}
}
