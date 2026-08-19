package request

// DiagnosticServiceRequest is the request body for POST/PUT /api/diagnostic-services.
type DiagnosticServiceRequest struct {
	Category    string                         `json:"category"` // 'lab' | 'radiologi'
	Name        string                         `json:"name"`
	Description string                         `json:"description"`
	Price       int64                          `json:"price"`
	IsActive    *bool                          `json:"is_active"`
	Items       []DiagnosticServiceItemRequest `json:"items"`
}

// DiagnosticServiceItemRequest is a single item within a diagnostic service.
type DiagnosticServiceItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}
