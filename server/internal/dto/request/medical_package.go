package request

// MedicalPackageRequest is the request body for POST/PUT /api/medical-packages.
type MedicalPackageRequest struct {
	Type        string                       `json:"type"` // 'mcu' | 'lab' | 'radiologi'
	Name        string                       `json:"name"`
	Description string                       `json:"description"`
	Price       int64                        `json:"price"`
	IsActive    *bool                        `json:"is_active"`
	Items       []MedicalPackageItemRequest  `json:"items"`
}

// MedicalPackageItemRequest is a single item within a medical package.
type MedicalPackageItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}
