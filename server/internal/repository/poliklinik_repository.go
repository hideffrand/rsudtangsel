package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// PoliklinikRepository mengelola operasi database untuk master data poliklinik (poli).
type PoliklinikRepository struct {
	db *sqlx.DB
}

// NewPoliklinikRepository membuat instance PoliklinikRepository baru.
func NewPoliklinikRepository(db *sqlx.DB) *PoliklinikRepository {
	return &PoliklinikRepository{db: db}
}

// FindAll mengembalikan semua poliklinik, diurutkan berdasarkan nama.
func (r *PoliklinikRepository) FindAll() ([]model.Poliklinik, error) {
	var list []model.Poliklinik
	query := `SELECT id, name, description, created_at, updated_at
	           FROM poliklinik ORDER BY name ASC`
	err := r.db.Select(&list, query)
	if err != nil {
		return nil, fmt.Errorf("list poliklinik: %w", err)
	}
	return list, nil
}

// FindByID mencari poliklinik berdasarkan ID. Mengembalikan nil jika tidak ditemukan.
func (r *PoliklinikRepository) FindByID(id int) (*model.Poliklinik, error) {
	var poli model.Poliklinik
	query := `SELECT id, name, description, created_at, updated_at
	           FROM poliklinik WHERE id = $1`
	err := r.db.Get(&poli, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find poliklinik: %w", err)
	}
	return &poli, nil
}

// FindByName mencari poliklinik berdasarkan nama. Mengembalikan nil jika tidak ditemukan.
func (r *PoliklinikRepository) FindByName(name string) (*model.Poliklinik, error) {
	var poli model.Poliklinik
	query := `SELECT id, name, description, created_at, updated_at
	           FROM poliklinik WHERE name = $1`
	err := r.db.Get(&poli, query, name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find poliklinik by name: %w", err)
	}
	return &poli, nil
}

// FindOrCreateByName mengembalikan ID poliklinik berdasarkan nama, membuat baris baru jika belum ada.
func (r *PoliklinikRepository) FindOrCreateByName(name string) (int, error) {
	var id int
	query := `INSERT INTO poliklinik (name) VALUES ($1)
	           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
	           RETURNING id`
	err := r.db.QueryRow(query, name).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("find or create poliklinik: %w", err)
	}
	return id, nil
}

// Create menyimpan poliklinik baru dan mengembalikan ID-nya.
func (r *PoliklinikRepository) Create(p *model.Poliklinik) (int, error) {
	query := `INSERT INTO poliklinik (name, description) VALUES ($1, $2) RETURNING id`
	var id int
	err := r.db.QueryRow(query, p.Name, p.Description).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create poliklinik: %w", err)
	}
	return id, nil
}

// Update memperbarui poliklinik. Mengembalikan false jika id tidak ditemukan.
func (r *PoliklinikRepository) Update(p *model.Poliklinik) (bool, error) {
	query := `UPDATE poliklinik SET name = $1, description = $2, updated_at = NOW() WHERE id = $3`
	res, err := r.db.Exec(query, p.Name, p.Description, p.ID)
	if err != nil {
		return false, fmt.Errorf("update poliklinik: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// Delete menghapus poliklinik. Mengembalikan false jika id tidak ditemukan.
func (r *PoliklinikRepository) Delete(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM poliklinik WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete poliklinik: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}
