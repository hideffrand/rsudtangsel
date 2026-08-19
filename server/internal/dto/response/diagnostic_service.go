package response

// DiagnosticServiceResponse is the response for a diagnostic service (Lab/Radiologi).
type DiagnosticServiceResponse struct {
	ID          int                             `json:"id"`
	Category    string                          `json:"category"` // 'lab' | 'radiologi'
	Name        string                          `json:"name"`
	Description string                          `json:"description"`
	Price       int64                           `json:"price"`
	IsActive    bool                            `json:"is_active"`
	Items       []DiagnosticServiceItemResponse `json:"items"`
}

// DiagnosticServiceItemResponse is a single item within a diagnostic service response.
type DiagnosticServiceItemResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
