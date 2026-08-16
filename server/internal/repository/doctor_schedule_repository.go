package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// DoctorScheduleRepository mengelola operasi database untuk tabel doctor_schedules.
type DoctorScheduleRepository struct {
	db *sqlx.DB
}

// NewDoctorScheduleRepository membuat instance DoctorScheduleRepository baru.
func NewDoctorScheduleRepository(db *sqlx.DB) *DoctorScheduleRepository {
	return &DoctorScheduleRepository{db: db}
}

// ScheduleEntry adalah jadwal dokter yang di-join dengan nama dokter.
type ScheduleEntry struct {
	model.DoctorSchedule
	DoctorName string `db:"doctor_name"`
}

// FindAll mengembalikan semua jadwal dokter. Jika doctorID > 0, difilter per dokter.
func (r *DoctorScheduleRepository) FindAll(doctorID int) ([]ScheduleEntry, error) {
	var list []ScheduleEntry
	query := `SELECT s.id, s.doctor_id, s.day_of_week, s.start_time::text AS start_time,
	                 s.end_time::text AS end_time, s.quota,
	                 s.created_at, s.updated_at, d.name AS doctor_name
	           FROM doctor_schedules s
	           JOIN doctors d ON d.id = s.doctor_id`
	if doctorID > 0 {
		query += ` WHERE s.doctor_id = $1`
	}
	query += ` ORDER BY s.day_of_week, s.start_time`

	var err error
	if doctorID > 0 {
		err = r.db.Select(&list, query, doctorID)
	} else {
		err = r.db.Select(&list, query)
	}
	if err != nil {
		return nil, fmt.Errorf("list doctor schedules: %w", err)
	}
	return list, nil
}

// Create menyimpan jadwal dokter baru dan mengembalikan ID-nya.
func (r *DoctorScheduleRepository) Create(s *model.DoctorSchedule) (int, error) {
	query := `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, quota)
	           VALUES ($1, $2, $3, $4, $5) RETURNING id`
	var id int
	err := r.db.QueryRow(query, s.DoctorID, s.DayOfWeek, s.StartTime, s.EndTime, s.Quota).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create doctor schedule: %w", err)
	}
	return id, nil
}

// FindEntryByID mengambil satu jadwal dokter (join nama dokter) berdasarkan ID.
// Mengembalikan nil jika tidak ditemukan.
func (r *DoctorScheduleRepository) FindEntryByID(id int) (*ScheduleEntry, error) {
	var entry ScheduleEntry
	query := `SELECT s.id, s.doctor_id, s.day_of_week, s.start_time::text AS start_time,
	                 s.end_time::text AS end_time, s.quota,
	                 s.created_at, s.updated_at, d.name AS doctor_name
	           FROM doctor_schedules s
	           JOIN doctors d ON d.id = s.doctor_id
	           WHERE s.id = $1`
	err := r.db.Get(&entry, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("find doctor schedule: %w", err)
	}
	return &entry, nil
}

// Update memperbarui jadwal dokter. Mengembalikan false jika id tidak ditemukan.
func (r *DoctorScheduleRepository) Update(s *model.DoctorSchedule) (bool, error) {
	query := `UPDATE doctor_schedules
	           SET doctor_id = $1, day_of_week = $2, start_time = $3, end_time = $4, quota = $5
	           WHERE id = $6`
	res, err := r.db.Exec(query, s.DoctorID, s.DayOfWeek, s.StartTime, s.EndTime, s.Quota, s.ID)
	if err != nil {
		return false, fmt.Errorf("update doctor schedule: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// Delete menghapus jadwal dokter. Mengembalikan false jika id tidak ditemukan.
func (r *DoctorScheduleRepository) Delete(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM doctor_schedules WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete doctor schedule: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}
