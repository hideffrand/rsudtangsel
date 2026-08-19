package model

import "time"

// Poliklinik merepresentasikan tabel poliklinik (master data poli) di database.
type Poliklinik struct {
	ID          int       `db:"id"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}
