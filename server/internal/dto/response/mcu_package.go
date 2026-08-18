package response

// McuPackageResponse is the response for an MCU package.
type McuPackageResponse struct {
	ID          int                       `json:"id"`
	Name        string                    `json:"name"`
	Description string                    `json:"description"`
	Price       int64                     `json:"price"`
	IsActive    bool                      `json:"is_active"`
	Items       []McuPackageItemResponse  `json:"items"`
}

// McuPackageItemResponse is a single item within an MCU package response.
type McuPackageItemResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
