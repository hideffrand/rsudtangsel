package model

// OCRDocumentType represents the ocr_document_types table (master data jenis dokumen OCR).
type OCRDocumentType struct {
	ID     string `db:"id"`
	Name   string `db:"name"`
	Fields string `db:"fields"`
}
