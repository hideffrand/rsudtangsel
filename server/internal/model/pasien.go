package model

import "time"

// Pasien merepresentasikan tabel pasien di database.
type Pasien struct {
	ID           int       `db:"id"`
	NIK          string    `db:"nik"`
	Nama         string    `db:"nama"`
	TanggalLahir time.Time `db:"tanggal_lahir"`
	Alamat       string    `db:"alamat"`
	NoHP         string    `db:"no_hp"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}
