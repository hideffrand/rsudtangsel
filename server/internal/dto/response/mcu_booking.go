package response

// McuBookingResponse is the full detail response for a single MCU booking.
type McuBookingResponse struct {
	ID            int    `json:"id"`
	BookingNumber string `json:"booking_number"` // e.g. MCU200826-001
	PackageID     int    `json:"package_id"`
	PackageName   string `json:"package_name"`

	// Patient info
	NIK         string `json:"nik"`
	FullName    string `json:"full_name"`
	PhoneNumber string `json:"phone_number"`
	BirthDate   string `json:"birth_date"`
	Address     string `json:"address"`

	// Scheduling
	BookingDate string `json:"booking_date"`
	BookingTime string `json:"booking_time"`

	// Diagnostic services
	LabTests       []string `json:"lab_tests"`
	RadiologyTests []string `json:"radiology_tests"`

	// Status & payment
	Status        string `json:"status"`
	TotalPrice    int64  `json:"total_price"` // IDR
	PaymentStatus string `json:"payment_status"`
	PaymentMethod string `json:"payment_method"`

	Notes     string `json:"notes"`
	CreatedAt string `json:"created_at"`
}

// McuBookingListItem is a compact row used in list endpoints.
type McuBookingListItem struct {
	ID            int    `json:"id"`
	BookingNumber string `json:"booking_number"`
	PackageName   string `json:"package_name"`
	FullName      string `json:"full_name"`
	NIK           string `json:"nik"`
	PhoneNumber   string `json:"phone_number"`
	BookingDate   string `json:"booking_date"`
	BookingTime   string `json:"booking_time"`
	Status        string `json:"status"`
	TotalPrice    int64  `json:"total_price"`
	CreatedAt     string `json:"created_at"`
}
