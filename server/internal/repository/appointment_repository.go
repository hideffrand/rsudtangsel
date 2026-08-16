package repository

import (
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// AppointmentRepository mengelola operasi database untuk tabel appointments.
type AppointmentRepository struct {
	db *sqlx.DB
}

// NewAppointmentRepository membuat instance AppointmentRepository baru.
func NewAppointmentRepository(db *sqlx.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

// Create menyimpan pendaftaran baru ke database.
func (r *AppointmentRepository) Create(a *model.Appointment) error {
	query := `INSERT INTO appointments
	           (patient_id, doctor_id, schedule_date, time, payment_type, queue_number, qr_code, status)
	           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(query,
		a.PatientID, a.DoctorID, a.ScheduleDate, a.Time,
		a.PaymentType, a.QueueNumber, a.QRCode, a.Status,
	)
	if err != nil {
		return fmt.Errorf("create appointment: %w", err)
	}
	return nil
}

// AntrianEntry adalah baris antrian yang di-join dengan nama pasien.
type AntrianEntry struct {
	QueueNumber string `db:"queue_number"`
	PatientName string `db:"patient_name"`
	Status      string `db:"status"`
}

// FindByDepartmentAndDate mengambil daftar antrian berdasarkan spesialisasi dan tanggal.
func (r *AppointmentRepository) FindByDepartmentAndDate(specialty, scheduleDate string) ([]AntrianEntry, error) {
	var list []AntrianEntry
	query := `SELECT a.queue_number, p.name AS patient_name, a.status
	           FROM appointments a
	           JOIN doctors d ON d.id = a.doctor_id
	           JOIN patients p ON p.id = a.patient_id
	           WHERE d.specialty = $1 AND a.schedule_date = $2
	           ORDER BY a.queue_number ASC`
	err := r.db.Select(&list, query, specialty, scheduleDate)
	if err != nil {
		return nil, fmt.Errorf("find appointments by department: %w", err)
	}
	return list, nil
}

// CountByDepartmentAndDate menghitung jumlah pendaftaran pada spesialisasi dan tanggal tertentu.
func (r *AppointmentRepository) CountByDepartmentAndDate(specialty, scheduleDate string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM appointments a
	           JOIN doctors d ON d.id = a.doctor_id
	           WHERE d.specialty = $1 AND a.schedule_date = $2`
	err := r.db.QueryRow(query, specialty, scheduleDate).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count appointments: %w", err)
	}
	return count, nil
}
