package model

import "time"

// Doctor merepresentasikan tabel doctors (master data dokter) di database.
type Doctor struct {
	ID            int       `db:"id"`
	Name          string    `db:"name"`
	Specialty     string    `db:"specialty"`
	LicenseNumber *string   `db:"license_number"`
	Email         string    `db:"email"`
	PhoneNumber   string    `db:"phone_number"`
	Bio           string    `db:"bio"`
	Status        string    `db:"status"`
	CreatedAt     time.Time `db:"created_at"`
	UpdatedAt     time.Time `db:"updated_at"`
}
