package model

import "time"

// Patient merepresentasikan tabel patients di database.
type Patient struct {
	ID          int       `db:"id"`
	NIK         string    `db:"nik"`
	Name        string    `db:"name"`
	BirthDate   time.Time `db:"birth_date"`
	Address     string    `db:"address"`
	PhoneNumber string    `db:"phone_number"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}
