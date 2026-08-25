package request

// OCRDocumentTypeRequest is the request body for POST/PUT /api/admin/ocr-document-types.
type OCRDocumentTypeRequest struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Fields string `json:"fields"`
}
