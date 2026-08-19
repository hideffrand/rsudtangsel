package request

// McuBookingRequest is the request body for POST /api/mcu/register.
type McuBookingRequest struct {
	// Package selection
	PackageID int `json:"package_id"` // required

	// Scheduling
	BookingDate string `json:"booking_date"` // required, "YYYY-MM-DD"
	BookingTime string `json:"booking_time"` // required, "HH:MM"

	// Patient information
	NIK         string `json:"nik"`          // required, 16 digits
	FullName    string `json:"full_name"`    // required
	BirthDate   string `json:"birth_date"`   // required, "YYYY-MM-DD"
	PhoneNumber string `json:"phone_number"` // required
	Address     string `json:"address"`      // optional

	// Additional diagnostic services chosen from navbar dropdowns
	LabTests       []string `json:"lab_tests"`       // e.g. ["hematologi", "gula_darah"]
	RadiologyTests []string `json:"radiology_tests"` // e.g. ["rontgen", "usg"]

	// Payment
	PaymentMethod string `json:"payment_method"` // transfer | qris | cash | bpjs
	Notes         string `json:"notes"`
}

// Validate returns a non-empty error message if the request is invalid.
func (r *McuBookingRequest) Validate() string {
	if r.PackageID <= 0 {
		return "package_id is required and must be > 0"
	}
	if r.BookingDate == "" {
		return "booking_date is required (YYYY-MM-DD)"
	}
	if r.BookingTime == "" {
		return "booking_time is required (HH:MM)"
	}
	if r.NIK == "" {
		return "nik is required"
	}
	if len(r.NIK) != 16 {
		return "nik must be exactly 16 digits"
	}
	if r.FullName == "" {
		return "full_name is required"
	}
	if r.BirthDate == "" {
		return "birth_date is required (YYYY-MM-DD)"
	}
	if r.PhoneNumber == "" {
		return "phone_number is required"
	}
	return ""
}

// McuBookingAdminUpdateRequest is the request body for PATCH /api/admin/mcu/bookings/{id}.
type McuBookingAdminUpdateRequest struct {
	Status        *string `json:"status"`         // pending | confirmed | completed | cancelled
	PaymentStatus *string `json:"payment_status"` // unpaid | awaiting_confirmation | paid | cancelled
	Notes         *string `json:"notes"`
}
