package model

import "time"

// McuBooking represents a row in the medical_package_bookings table.
type MedicalPackageBooking struct {
	ID          int       `db:"id"`
	PatientID   *int      `db:"patient_id"`   // nullable - walk-in patients have no account
	PackageID   int       `db:"package_id"`
	BookingDate string    `db:"booking_date"` // "YYYY-MM-DD"
	BookingTime string    `db:"booking_time"` // "HH:MM"

	// Patient contact info (always stored here regardless of account link)
	NIK         string `db:"nik"`
	FullName    string `db:"full_name"`
	BirthDate   string `db:"birth_date"`
	PhoneNumber string `db:"phone_number"`
	Address     string `db:"address"`

	// Selected diagnostic services (PostgreSQL TEXT[] via pq.Array)
	LabTests       []string `db:"lab_tests"`
	RadiologyTests []string `db:"radiology_tests"`

	// Lifecycle:  pending → confirmed → completed
	//                       ↓
	//                   cancelled
	Status string `db:"status"`

	// Harga total paket (IDR) — hanya catatan harga, tanpa alur pembayaran.
	TotalPrice int64 `db:"total_price"` // IDR (Rupiah)

	Notes string `db:"notes"`

	BookingNumber string `db:"booking_number"` // e.g. MCU200826-001

	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}
