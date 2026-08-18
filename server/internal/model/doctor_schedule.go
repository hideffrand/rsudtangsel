package model

import "time"

// DoctorSchedule merepresentasikan tabel doctor_schedules di database.
// EndTime nil berarti jadwal buka sampai selesai ("Selesai").
type DoctorSchedule struct {
	ID        int       `db:"id"`
	DoctorID  int       `db:"doctor_id"`
	DayOfWeek string    `db:"day_of_week"`
	StartTime string    `db:"start_time"`
	EndTime   *string   `db:"end_time"`
	Quota     int       `db:"quota"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}
