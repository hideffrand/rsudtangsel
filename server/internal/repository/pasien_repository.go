package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// PasienRepository mengelola operasi database untuk tabel pasien.
type PasienRepository struct {
	db *sqlx.DB
}

// NewPasienRepository membuat instance PasienRepository baru.
func NewPasienRepository(db *sqlx.DB) *PasienRepository {
	return &PasienRepository{db: db}
}

// FindByNIK mencari pasien berdasarkan NIK. Mengembalikan nil jika tidak ditemukan.
func (r *PasienRepository) FindByNIK(nik string) (*model.Pasien, error) {
	var pasien model.Pasien
	query := `SELECT id, nik, nama, tanggal_lahir, alamat, no_hp, created_at, updated_at
	           FROM pasien WHERE nik = $1`
	err := r.db.Get(&pasien, query, nik)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find pasien by nik: %w", err)
	}
	return &pasien, nil
}

// Create menyimpan pasien baru dan mengembalikan ID-nya.
func (r *PasienRepository) Create(p *model.Pasien) (int, error) {
	query := `INSERT INTO pasien (nik, nama, tanggal_lahir, alamat, no_hp)
	           VALUES ($1, $2, $3, $4, $5) RETURNING id`
	var id int
	err := r.db.QueryRow(query, p.NIK, p.Nama, p.TanggalLahir, p.Alamat, p.NoHP).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create pasien: %w", err)
	}
	return id, nil
}
