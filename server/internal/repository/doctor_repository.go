package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// DoctorRepository mengelola operasi database untuk master data doctors.
type DoctorRepository struct {
	db *sqlx.DB
}

// NewDoctorRepository membuat instance DoctorRepository baru.
func NewDoctorRepository(db *sqlx.DB) *DoctorRepository {
	return &DoctorRepository{db: db}
}

// GetAll mengembalikan semua dokter.
func (r *DoctorRepository) GetAll() ([]model.Doctor, error) {
	var list []model.Doctor
	query := `SELECT id, name, specialty, poli_id, license_number, email, phone_number, bio, status, created_at, updated_at
	           FROM doctors ORDER BY name ASC`
	err := r.db.Select(&list, query)
	if err != nil {
		return nil, fmt.Errorf("list doctors: %w", err)
	}
	return list, nil
}

// FindByID mencari dokter berdasarkan ID. Mengembalikan nil jika tidak ditemukan.
func (r *DoctorRepository) FindByID(id int) (*model.Doctor, error) {
	var doctor model.Doctor
	query := `SELECT id, name, specialty, poli_id, license_number, email, phone_number, bio, status, created_at, updated_at
	           FROM doctors WHERE id = $1`
	err := r.db.Get(&doctor, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find doctor: %w", err)
	}
	return &doctor, nil
}

// Create menyimpan dokter baru dan mengembalikan ID-nya.
func (r *DoctorRepository) Create(d *model.Doctor) (int, error) {
	query := `INSERT INTO doctors (name, specialty, poli_id, license_number, email, phone_number, bio, status)
	           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
	var id int
	err := r.db.QueryRow(query, d.Name, d.Specialty, d.PoliID, d.LicenseNumber, d.Email, d.PhoneNumber, d.Bio, d.Status).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create doctor: %w", err)
	}
	return id, nil
}

// Update memperbarui dokter. Mengembalikan false jika id tidak ditemukan.
func (r *DoctorRepository) Update(d *model.Doctor) (bool, error) {
	query := `UPDATE doctors
	           SET name = $1, specialty = $2, poli_id = $3, license_number = $4, email = $5, phone_number = $6, bio = $7, status = $8
	           WHERE id = $9`
	res, err := r.db.Exec(query, d.Name, d.Specialty, d.PoliID, d.LicenseNumber, d.Email, d.PhoneNumber, d.Bio, d.Status, d.ID)
	if err != nil {
		return false, fmt.Errorf("update doctor: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// Delete menghapus dokter. Mengembalikan false jika id tidak ditemukan.
func (r *DoctorRepository) Delete(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM doctors WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete doctor: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}
