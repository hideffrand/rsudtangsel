package response

// OCRDocumentTypeResponse is the response payload for an OCR document type (master data jenis dokumen OCR).
type OCRDocumentTypeResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Fields string `json:"fields"`
}
