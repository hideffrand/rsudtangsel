package repository

import (
	"fmt"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
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

// CountPatientsByDate menghitung jumlah pasien unik yang terdaftar pada tanggal tertentu.
func (r *AppointmentRepository) CountPatientsByDate(date string) (int, error) {
	var count int
	query := `SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE schedule_date = $1`
	err := r.db.QueryRow(query, date).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count patients by date: %w", err)
	}
	return count, nil
}

// AvgWaitingTime menghitung rata-rata waktu tunggu (menit) untuk appointment selesai pada tanggal tertentu.
func (r *AppointmentRepository) AvgWaitingTime(date string) (float64, error) {
	var avg float64
	query := `SELECT COALESCE(
	             AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60),
	             0
	           )
	           FROM appointments
	           WHERE status = 'done' AND schedule_date = $1`
	err := r.db.QueryRow(query, date).Scan(&avg)
	if err != nil {
		return 0, fmt.Errorf("avg waiting time: %w", err)
	}
	return avg, nil
}

// CountWaitingToday menghitung total appointment yang masih berstatus 'waiting' hari ini.
func (r *AppointmentRepository) CountWaitingToday(date string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM appointments WHERE status = 'waiting' AND schedule_date = $1`
	err := r.db.QueryRow(query, date).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count waiting today: %w", err)
	}
	return count, nil
}

// AdminAppointmentItem adalah baris antrian untuk admin dashboard (join dengan patient dan doctor).
type AdminAppointmentItem struct {
	ID           int    `db:"id"`
	QueueNumber  string `db:"queue_number"`
	PatientName  string `db:"patient_name"`
	DoctorName   string `db:"doctor_name"`
	Specialty    string `db:"specialty"`
	Status       string `db:"status"`
	CreatedAt    string `db:"created_at"`
}

// FindAllByDateWithPatient mengambil semua antrian hari ini beserta nama pasien dan dokter (untuk admin).
func (r *AppointmentRepository) FindAllByDateWithPatient(date string) ([]response.AdminAntrianItem, error) {
	var rows []AdminAppointmentItem
	query := `SELECT a.id, a.queue_number, p.name AS patient_name, d.name AS doctor_name,
	                 d.specialty, a.status,
	                 TO_CHAR(a.created_at, 'HH24:MI:SS') AS created_at
	           FROM appointments a
	           JOIN patients p ON p.id = a.patient_id
	           JOIN doctors d ON d.id = a.doctor_id
	           WHERE a.schedule_date = $1
	           ORDER BY a.queue_number ASC`
	err := r.db.Select(&rows, query, date)
	if err != nil {
		return nil, fmt.Errorf("find all appointments with patient: %w", err)
	}
	items := make([]response.AdminAntrianItem, len(rows))
	for i, row := range rows {
		items[i] = response.AdminAntrianItem{
			ID:        row.ID,
			Nomor:     row.QueueNumber,
			Nama:      row.PatientName,
			Poli:      row.Specialty,
			Dokter:    row.DoctorName,
			Status:    capitalizeFirst(row.Status),
			CreatedAt: row.CreatedAt,
		}
	}
	return items, nil
}

// FindByDepartmentAndDateWithPatient mengambil antrian untuk spesialisasi tertentu beserta detail pasien.
func (r *AppointmentRepository) FindByDepartmentAndDateWithPatient(specialty, date string) ([]response.AdminAntrianItem, error) {
	var rows []AdminAppointmentItem
	query := `SELECT a.id, a.queue_number, p.name AS patient_name, d.name AS doctor_name,
	                 d.specialty, a.status,
	                 TO_CHAR(a.created_at, 'HH24:MI:SS') AS created_at
	           FROM appointments a
	           JOIN patients p ON p.id = a.patient_id
	           JOIN doctors d ON d.id = a.doctor_id
	           WHERE d.specialty = $1 AND a.schedule_date = $2
	           ORDER BY a.queue_number ASC`
	err := r.db.Select(&rows, query, specialty, date)
	if err != nil {
		return nil, fmt.Errorf("find appointments by department with patient: %w", err)
	}
	items := make([]response.AdminAntrianItem, len(rows))
	for i, row := range rows {
		items[i] = response.AdminAntrianItem{
			ID:        row.ID,
			Nomor:     row.QueueNumber,
			Nama:      row.PatientName,
			Poli:      row.Specialty,
			Dokter:    row.DoctorName,
			Status:    capitalizeFirst(row.Status),
			CreatedAt: row.CreatedAt,
		}
	}
	return items, nil
}

// UpdateAppointmentStatus memperbarui status appointment dan mengembalikan detail antrian.
func (r *AppointmentRepository) UpdateAppointmentStatus(id int, status string) (*response.CallAntrianResponse, error) {
	var partial struct {
		ID          int    `db:"id"`
		QueueNumber string `db:"queue_number"`
		Status      string `db:"status"`
	}
	query := `UPDATE appointments SET status = $1, updated_at = NOW()
	          WHERE id = $2
	          RETURNING id, queue_number, status`
	err := r.db.QueryRowx(query, status, id).StructScan(&partial)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, fmt.Errorf("appointment dengan id %d tidak ditemukan", id)
		}
		return nil, fmt.Errorf("update appointment status: %w", err)
	}
	// Ambil nama pasien dan spesialisasi dari join
	var patientName, specialty, doctorName string
	nameQuery := `SELECT p.name, d.specialty, d.name AS doctor_name
	               FROM patients p
	               JOIN appointments a ON a.patient_id = p.id
	               JOIN doctors d ON d.id = a.doctor_id
	               WHERE a.id = $1`
	_ = r.db.QueryRow(nameQuery, id).Scan(&patientName, &specialty, &doctorName)

	return &response.CallAntrianResponse{
		ID:       partial.ID,
		Nomor:    partial.QueueNumber,
		Nama:     patientName,
		Poli:     specialty,
		Status:   capitalizeFirst(partial.Status),
		CalledAt: time.Now().UTC().Format("15:04:05"),
	}, nil
}

// capitalizeFirst mengubah huruf pertama menjadi kapital (ASCII only).
func capitalizeFirst(s string) string {
	if len(s) == 0 || s[0] < 'a' || s[0] > 'z' {
		return s
	}
	return string(s[0]-32) + s[1:]
}
