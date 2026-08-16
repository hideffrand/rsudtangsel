package model

import "time"

// Pendaftaran merepresentasikan tabel pendaftaran di database.
type Pendaftaran struct {
	ID              int       `db:"id"`
	PasienID        int       `db:"pasien_id"`
	Poli            string    `db:"poli"`
	Dokter          string    `db:"dokter"`
	Tanggal         time.Time `db:"tanggal"`
	Jam             string    `db:"jam"`
	JenisPembayaran string    `db:"jenis_pembayaran"`
	NomorAntrian    string    `db:"nomor_antrian"`
	QRCode          string    `db:"qr_code"`
	Status          string    `db:"status"`
	CreatedAt       time.Time `db:"created_at"`
	UpdatedAt       time.Time `db:"updated_at"`
}
