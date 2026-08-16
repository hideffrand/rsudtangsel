package request

// DoctorRequest adalah struct untuk request body POST/PUT /api/doctors.
// LicenseNumber nil berarti belum ada nomor izin praktik.
type DoctorRequest struct {
	Name          string  `json:"name"`
	Specialty     string  `json:"specialty"`
	LicenseNumber *string `json:"license_number"`
	Email         string  `json:"email"`
	PhoneNumber   string  `json:"phone_number"`
	Bio           string  `json:"bio"`
	Status        string  `json:"status"`
}
