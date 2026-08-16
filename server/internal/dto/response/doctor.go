package response

// DoctorResponse adalah response untuk data master dokter.
type DoctorResponse struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	Specialty     string  `json:"specialty"`
	LicenseNumber *string `json:"license_number"`
	Email         string  `json:"email"`
	PhoneNumber   string  `json:"phone_number"`
	Bio           string  `json:"bio"`
	Status        string  `json:"status"`
}

// DoctorScheduleResponse adalah response untuk jadwal dokter.
// EndTime nil berarti buka sampai selesai.
type DoctorScheduleResponse struct {
	ID         int     `json:"id"`
	DoctorID   int     `json:"doctor_id"`
	DoctorName string  `json:"doctor_name"`
	DayOfWeek  string  `json:"day_of_week"`
	StartTime  string  `json:"start_time"`
	EndTime    *string `json:"end_time"`
	Quota      int     `json:"quota"`
}
