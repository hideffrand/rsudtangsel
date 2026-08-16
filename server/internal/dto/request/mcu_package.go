package request

// McuPackageRequest is the request body for POST/PUT /api/mcu-packages.
type McuPackageRequest struct {
	Name        string                  `json:"name"`
	Description string                  `json:"description"`
	Price       int64                   `json:"price"`
	IsActive    *bool                   `json:"is_active"`
	Items       []McuPackageItemRequest `json:"items"`
}

// McuPackageItemRequest is a single item within an MCU package.
type McuPackageItemRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}
