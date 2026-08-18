package request

// ScheduleRequest adalah struct untuk request body POST/PUT /api/schedules.
// EndTime nil berarti buka sampai selesai ("Selesai").
type ScheduleRequest struct {
	DoctorID   int     `json:"doctor_id"`
	DayOfWeek  string  `json:"day_of_week"`
	StartTime  string  `json:"start_time"`
	EndTime    *string `json:"end_time"`
	Quota      int     `json:"quota"`
}
