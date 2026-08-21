package service

import (
	"errors"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrOCRDocumentTypeNotFound is returned when an OCR document type does not exist.
var ErrOCRDocumentTypeNotFound = errors.New("OCR document type not found")

// OCRDocumentTypeService handles business logic for OCR document types (master data).
type OCRDocumentTypeService struct {
	repo *repository.OCRDocumentTypeRepository
}

// NewOCRDocumentTypeService creates a new OCRDocumentTypeService.
func NewOCRDocumentTypeService(repo *repository.OCRDocumentTypeRepository) *OCRDocumentTypeService {
	return &OCRDocumentTypeService{repo: repo}
}

// CreateOCRDocumentType creates a new OCR document type.
func (s *OCRDocumentTypeService) CreateOCRDocumentType(req request.OCRDocumentTypeRequest) (*response.OCRDocumentTypeResponse, error) {
	if err := s.repo.Create(&model.OCRDocumentType{
		ID:     req.ID,
		Name:   req.Name,
		Fields: req.Fields,
	}); err != nil {
		return nil, err
	}
	return s.GetOCRDocumentType(req.ID)
}

// GetAllOCRDocumentTypes returns all OCR document types.
func (s *OCRDocumentTypeService) GetAllOCRDocumentTypes() ([]response.OCRDocumentTypeResponse, error) {
	items, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	list := make([]response.OCRDocumentTypeResponse, len(items))
	for i, it := range items {
		list[i] = toOCRDocumentTypeResponse(it)
	}
	return list, nil
}

// GetOCRDocumentType returns a single OCR document type, or nil if not found.
func (s *OCRDocumentTypeService) GetOCRDocumentType(id string) (*response.OCRDocumentTypeResponse, error) {
	item, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, nil
	}
	resp := toOCRDocumentTypeResponse(*item)
	return &resp, nil
}

// UpdateOCRDocumentType updates an OCR document type by id.
func (s *OCRDocumentTypeService) UpdateOCRDocumentType(id string, req request.OCRDocumentTypeRequest) (*response.OCRDocumentTypeResponse, error) {
	updated, err := s.repo.Update(id, &model.OCRDocumentType{
		Name:   req.Name,
		Fields: req.Fields,
	})
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrOCRDocumentTypeNotFound
	}
	return s.GetOCRDocumentType(id)
}

// DeleteOCRDocumentType deletes an OCR document type.
func (s *OCRDocumentTypeService) DeleteOCRDocumentType(id string) error {
	deleted, err := s.repo.Delete(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrOCRDocumentTypeNotFound
	}
	return nil
}

func toOCRDocumentTypeResponse(dt model.OCRDocumentType) response.OCRDocumentTypeResponse {
	return response.OCRDocumentTypeResponse{
		ID:     dt.ID,
		Name:   dt.Name,
		Fields: dt.Fields,
	}
}
