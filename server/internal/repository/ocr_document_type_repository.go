package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// OCRDocumentTypeRepository manages database operations for ocr_document_types.
type OCRDocumentTypeRepository struct {
	db *sqlx.DB
}

// NewOCRDocumentTypeRepository creates a new OCRDocumentTypeRepository.
func NewOCRDocumentTypeRepository(db *sqlx.DB) *OCRDocumentTypeRepository {
	return &OCRDocumentTypeRepository{db: db}
}

// Create inserts a new OCR document type.
func (r *OCRDocumentTypeRepository) Create(dt *model.OCRDocumentType) error {
	_, err := r.db.Exec(
		`INSERT INTO ocr_document_types (id, name, fields) VALUES ($1, $2, $3)`,
		dt.ID, dt.Name, dt.Fields,
	)
	if err != nil {
		return fmt.Errorf("create OCR document type: %w", err)
	}
	return nil
}

// FindAll returns all OCR document types ordered by name.
func (r *OCRDocumentTypeRepository) FindAll() ([]model.OCRDocumentType, error) {
	var list []model.OCRDocumentType
	if err := r.db.Select(&list, `SELECT id, name, fields FROM ocr_document_types ORDER BY name`); err != nil {
		return nil, fmt.Errorf("list OCR document types: %w", err)
	}
	return list, nil
}

// FindByID returns an OCR document type by id, or nil if not found.
func (r *OCRDocumentTypeRepository) FindByID(id string) (*model.OCRDocumentType, error) {
	var dt model.OCRDocumentType
	err := r.db.Get(&dt, `SELECT id, name, fields FROM ocr_document_types WHERE id = $1`, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find OCR document type: %w", err)
	}
	return &dt, nil
}

// Update updates an OCR document type by id. Returns false if the id does not exist.
func (r *OCRDocumentTypeRepository) Update(id string, dt *model.OCRDocumentType) (bool, error) {
	res, err := r.db.Exec(
		`UPDATE ocr_document_types SET name = $1, fields = $2 WHERE id = $3`,
		dt.Name, dt.Fields, id,
	)
	if err != nil {
		return false, fmt.Errorf("update OCR document type: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// Delete removes an OCR document type. Returns false if the id does not exist.
func (r *OCRDocumentTypeRepository) Delete(id string) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM ocr_document_types WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete OCR document type: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}
