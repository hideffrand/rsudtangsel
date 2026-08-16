package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// PatientRepository mengelola operasi database untuk tabel patients.
type PatientRepository struct {
	db *sqlx.DB
}

// NewPatientRepository membuat instance PatientRepository baru.
func NewPatientRepository(db *sqlx.DB) *PatientRepository {
	return &PatientRepository{db: db}
}

// FindByNIK mencari pasien berdasarkan NIK. Mengembalikan nil jika tidak ditemukan.
func (r *PatientRepository) FindByNIK(nik string) (*model.Patient, error) {
	var patient model.Patient
	query := `SELECT id, nik, name, birth_date, address, phone_number, created_at, updated_at
	           FROM patients WHERE nik = $1`
	err := r.db.Get(&patient, query, nik)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find patient by nik: %w", err)
	}
	return &patient, nil
}

// Create menyimpan pasien baru dan mengembalikan ID-nya.
func (r *PatientRepository) Create(p *model.Patient) (int, error) {
	query := `INSERT INTO patients (nik, name, birth_date, address, phone_number)
	           VALUES ($1, $2, $3, $4, $5) RETURNING id`
	var id int
	err := r.db.QueryRow(query, p.NIK, p.Name, p.BirthDate, p.Address, p.PhoneNumber).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create patient: %w", err)
	}
	return id, nil
}
