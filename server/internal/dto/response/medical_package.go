package response

// MedicalPackageResponse is the response for a medical package (MCU/Lab/Radiologi).
type MedicalPackageResponse struct {
	ID          int                            `json:"id"`
	Type        string                         `json:"type"` // 'mcu' | 'lab' | 'radiologi'
	Name        string                         `json:"name"`
	Description string                         `json:"description"`
	Price       int64                          `json:"price"`
	IsActive    bool                           `json:"is_active"`
	Items       []MedicalPackageItemResponse   `json:"items"`
}

// MedicalPackageItemResponse is a single item within a medical package response.
type MedicalPackageItemResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
