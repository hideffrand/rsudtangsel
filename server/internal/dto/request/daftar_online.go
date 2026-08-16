package request

// DaftarOnlineRequest adalah struct untuk request body POST /api/daftar-online.
type DaftarOnlineRequest struct {
	NIK          string `json:"nik"`
	Name         string `json:"name"`
	BirthDate    string `json:"birth_date"`
	Address      string `json:"address"`
	PhoneNumber  string `json:"phone_number"`
	DoctorID     int    `json:"doctor_id"`
	ScheduleDate string `json:"schedule_date"`
	Time         string `json:"time"`
	PaymentType  string `json:"payment_type"`
}
