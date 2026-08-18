package model

import "time"

// Appointment merepresentasikan tabel appointments (pendaftaran) di database.
type Appointment struct {
	ID           int       `db:"id"`
	PatientID    int       `db:"patient_id"`
	DoctorID     int       `db:"doctor_id"`
	ScheduleDate time.Time `db:"schedule_date"`
	Time         string    `db:"time"`
	PaymentType  string    `db:"payment_type"`
	QueueNumber  string    `db:"queue_number"`
	QRCode       string    `db:"qr_code"`
	Status       string    `db:"status"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
