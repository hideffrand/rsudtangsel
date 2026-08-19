package repository

import (
	"fmt"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// AppointmentRepository handles all database operations for the appointments table.
type AppointmentRepository struct {
	db *sqlx.DB
}

// NewAppointmentRepository creates a new AppointmentRepository instance.
func NewAppointmentRepository(db *sqlx.DB) *AppointmentRepository {
	return &AppointmentRepository{db: db}
}

// Create inserts a new appointment into the database.
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

// QueueEntry is a joined row returned by the public queue endpoint.
type QueueEntry struct {
	QueueNumber string `db:"queue_number"`
	PatientName string `db:"patient_name"`
	Status      string `db:"status"`
}

// FindByDepartmentAndDate retrieves the appointment queue filtered by specialty and date.
func (r *AppointmentRepository) FindByDepartmentAndDate(specialty, scheduleDate string) ([]QueueEntry, error) {
	var list []QueueEntry
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

// CountByDepartmentAndDate counts appointments for a given specialty and date.
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

// CountPatientsByDate counts unique patients registered on a given date.
func (r *AppointmentRepository) CountPatientsByDate(date string) (int, error) {
	var count int
	query := `SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE schedule_date = $1`
	err := r.db.QueryRow(query, date).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count patients by date: %w", err)
	}
	return count, nil
}

// AvgWaitingTime calculates the average waiting time in minutes for completed appointments on a given date.
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

// CountWaitingToday counts appointments still in 'waiting' status for a given date.
func (r *AppointmentRepository) CountWaitingToday(date string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM appointments WHERE status = 'waiting' AND schedule_date = $1`
	err := r.db.QueryRow(query, date).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count waiting today: %w", err)
	}
	return count, nil
}

// AdminAppointmentItem is a joined row for the admin dashboard queue view.
type AdminAppointmentItem struct {
	ID          int    `db:"id"`
	QueueNumber string `db:"queue_number"`
	PatientName string `db:"patient_name"`
	DoctorName  string `db:"doctor_name"`
	Specialty   string `db:"specialty"`
	Status      string `db:"status"`
	CreatedAt   string `db:"created_at"`
}

// FindAllByDateWithPatient retrieves all appointments for a given date with patient and doctor details.
func (r *AppointmentRepository) FindAllByDateWithPatient(date string) ([]response.AdminQueueItem, error) {
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
	items := make([]response.AdminQueueItem, len(rows))
	for i, row := range rows {
		items[i] = response.AdminQueueItem{
			ID:          row.ID,
			Number:      row.QueueNumber,
			PatientName: row.PatientName,
			Poli:        row.Specialty,
			DoctorName:  row.DoctorName,
			Status:      capitalizeFirst(row.Status),
			CreatedAt:   row.CreatedAt,
		}
	}
	return items, nil
}

// FindByDepartmentAndDateWithPatient retrieves appointments for a specific specialty and date, with patient details.
func (r *AppointmentRepository) FindByDepartmentAndDateWithPatient(specialty, date string) ([]response.AdminQueueItem, error) {
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
	items := make([]response.AdminQueueItem, len(rows))
	for i, row := range rows {
		items[i] = response.AdminQueueItem{
			ID:          row.ID,
			Number:      row.QueueNumber,
			PatientName: row.PatientName,
			Poli:        row.Specialty,
			DoctorName:  row.DoctorName,
			Status:      capitalizeFirst(row.Status),
			CreatedAt:   row.CreatedAt,
		}
	}
	return items, nil
}

// UpdateAppointmentStatus updates the status of an appointment and returns the updated record.
func (r *AppointmentRepository) UpdateAppointmentStatus(id int, status string) (*response.CallQueueResponse, error) {
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
			return nil, fmt.Errorf("appointment with id %d not found", id)
		}
		return nil, fmt.Errorf("update appointment status: %w", err)
	}

	// Fetch patient name and specialty via join
	var patientName, specialty, doctorName string
	nameQuery := `SELECT p.name, d.specialty, d.name AS doctor_name
	               FROM patients p
	               JOIN appointments a ON a.patient_id = p.id
	               JOIN doctors d ON d.id = a.doctor_id
	               WHERE a.id = $1`
	_ = r.db.QueryRow(nameQuery, id).Scan(&patientName, &specialty, &doctorName)

	return &response.CallQueueResponse{
		ID:          partial.ID,
		Number:      partial.QueueNumber,
		PatientName: patientName,
		Poli:        specialty,
		Status:      capitalizeFirst(partial.Status),
		CalledAt:    time.Now().UTC().Format("15:04:05"),
	}, nil
}

// capitalizeFirst uppercases the first character of a string (ASCII only).
func capitalizeFirst(s string) string {
	if len(s) == 0 || s[0] < 'a' || s[0] > 'z' {
		return s
	}
	return string(s[0]-32) + s[1:]
}

// CountActiveDoctors returns the number of distinct doctors who have at least
// one appointment scheduled for the given date.
func (r *AppointmentRepository) CountActiveDoctors(date string) (int, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(DISTINCT doctor_id) FROM appointments WHERE schedule_date = $1`,
		date,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count active doctors: %w", err)
	}
	return count, nil
}
