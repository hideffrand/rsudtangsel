package repository

import (
	"fmt"
	"strings"
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
	PatientNIK  string `db:"patient_nik"`
	PatientPhone string `db:"patient_phone"`
	DoctorName  string `db:"doctor_name"`
	DoctorPhone string `db:"doctor_phone"`
	Specialty   string `db:"specialty"`
	Status      string `db:"status"`
	CreatedAt   string `db:"created_at"`
}

// FindAllByDateWithPatient retrieves all appointments for a given date with patient and doctor details.
func (r *AppointmentRepository) FindAllByDateWithPatient(date string) ([]response.AdminQueueItem, error) {
	var rows []AdminAppointmentItem
	query := `SELECT a.id, a.queue_number, p.name AS patient_name,
	                 COALESCE(p.nik, '') AS patient_nik,
	                 COALESCE(p.phone_number, '') AS patient_phone,
	                 d.name AS doctor_name,
	                 COALESCE(d.phone_number, '081295951234') AS doctor_phone,
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
		docPhone := row.DoctorPhone
		if docPhone == "" {
			docPhone = "081295951234"
		}
		items[i] = response.AdminQueueItem{
			ID:          row.ID,
			Number:      row.QueueNumber,
			PatientName: row.PatientName,
			NIK:         row.PatientNIK,
			PhoneNumber: row.PatientPhone,
			Poli:        row.Specialty,
			DoctorName:  row.DoctorName,
			DoctorPhone: docPhone,
			Status:      capitalizeFirst(row.Status),
			CreatedAt:   row.CreatedAt,
		}
	}
	return items, nil
}

// FindByDepartmentAndDateWithPatient retrieves appointments for a specific specialty and date, with patient details.
func (r *AppointmentRepository) FindByDepartmentAndDateWithPatient(specialty, date string) ([]response.AdminQueueItem, error) {
	var rows []AdminAppointmentItem
	query := `SELECT a.id, a.queue_number, p.name AS patient_name,
	                 COALESCE(p.nik, '') AS patient_nik,
	                 COALESCE(p.phone_number, '') AS patient_phone,
	                 d.name AS doctor_name,
	                 COALESCE(d.phone_number, '081295951234') AS doctor_phone,
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
		docPhone := row.DoctorPhone
		if docPhone == "" {
			docPhone = "081295951234"
		}
		items[i] = response.AdminQueueItem{
			ID:          row.ID,
			Number:      row.QueueNumber,
			PatientName: row.PatientName,
			NIK:         row.PatientNIK,
			PhoneNumber: row.PatientPhone,
			Poli:        row.Specialty,
			DoctorName:  row.DoctorName,
			DoctorPhone: docPhone,
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

// FinishAppointmentConsultation updates appointment outcome with family WA and attending doctor linkage.
func (r *AppointmentRepository) FinishAppointmentConsultation(
	id int,
	outcome, familyPhone, familyName, notes, medicalRecordNo string,
) (*response.FinishQueueResponse, error) {
	dbStatus := strings.ToLower(outcome)
	if dbStatus == "rawatinap" {
		dbStatus = "rawat_inap"
	} else if dbStatus == "rawatjalan" {
		dbStatus = "rawat_jalan"
	} else if dbStatus == "rujukanspesialis" {
		dbStatus = "rujukan"
	} else if dbStatus == "done" {
		dbStatus = "done"
	}

	var partial struct {
		ID          int    `db:"id"`
		QueueNumber string `db:"queue_number"`
		Status      string `db:"status"`
	}
	updateQuery := `UPDATE appointments SET status = $1, updated_at = NOW()
	                WHERE id = $2
	                RETURNING id, queue_number, status`
	err := r.db.QueryRowx(updateQuery, dbStatus, id).StructScan(&partial)
	if err != nil {
		return nil, fmt.Errorf("finish appointment: %w", err)
	}

	// Fetch patient and doctor info
	var patientName, patientNIK, patientPhone, doctorName, doctorPhone, specialty string
	infoQuery := `SELECT p.name, COALESCE(p.nik, ''), COALESCE(p.phone_number, ''),
	                     d.name, COALESCE(d.phone_number, '081295951234'), d.specialty
	              FROM appointments a
	              JOIN patients p ON p.id = a.patient_id
	              JOIN doctors d ON d.id = a.doctor_id
	              WHERE a.id = $1`
	_ = r.db.QueryRow(infoQuery, id).Scan(
		&patientName, &patientNIK, &patientPhone,
		&doctorName, &doctorPhone, &specialty,
	)

	if doctorPhone == "" {
		doctorPhone = "081295951234"
	}

	// Build WhatsApp click-to-chat URL connecting patient family and doctor
	var waURL, docWaURL string
	targetFamilyPhone := familyPhone
	if targetFamilyPhone == "" {
		targetFamilyPhone = patientPhone
	}

	formattedFamilyPhone := formatWANumber(targetFamilyPhone)
	formattedDoctorPhone := formatWANumber(doctorPhone)

	outcomeLabel := "Selesai Pemeriksaan"
	if outcome == "RawatInap" {
		outcomeLabel = "RAWAT INAP (Kamar Rawat / Observasi)"
	} else if outcome == "RawatJalan" {
		outcomeLabel = "RAWAT JALAN (Jadwal Kontrol Berkala)"
	} else if outcome == "RujukanSpesialis" {
		outcomeLabel = "RUJUKAN DOKTER SPESIALIS"
	}

	if formattedFamilyPhone != "" {
		greeting := "Keluarga Pasien"
		if familyName != "" {
			greeting = familyName
		}
		msg := fmt.Sprintf(
			"🤖 *[CHATBOT RSU TANGSEL CARE]*\n\n"+
				"Halo Bpk/Ibu %s,\n\n"+
				"Saya adalah Chatbot Resmi RSU Tangsel Care. Pesan ini dikirim secara otomatis untuk memberikan perkembangan pelayanan kesehatan keluarga Anda:\n\n"+
				"• *Atas Nama Pasien:* %s\n"+
				"• *Poliklinik:* %s\n"+
				"• *No. Antrian:* %s\n\n"+
				"• *Dalam Tahap:* %s\n\n"+
				"• *Berikut Catatan Dokter:* \n\"%s\"\n\n"+
				"• *Berikut Nomor Dokter yang Menjaga Pasien Tersebut:* \n"+
				"  Nama Dokter: %s\n"+
				"  Hubungi Dokter (WA): https://wa.me/%s\n\n"+
				"Terima kasih. Anda dapat membalas pesan ini atau langsung menghubungi dokter melalui kontak di atas.",
			greeting, patientName, specialty, partial.QueueNumber,
			outcomeLabel, notes, doctorName, formattedDoctorPhone,
		)
		waURL = fmt.Sprintf("https://wa.me/%s?text=%s", formattedFamilyPhone, urlQueryEscape(msg))
	}

	if formattedDoctorPhone != "" {
		docMsg := fmt.Sprintf(
			"Halo %s, laporan tindak lanjut pasien *%s* (%s) Poli %s:\n"+
				"Status: *%s*\nCatatan: %s\nKontak Keluarga: %s (%s).",
			doctorName, patientName, partial.QueueNumber, specialty,
			outcomeLabel, notes, targetFamilyPhone, familyName,
		)
		docWaURL = fmt.Sprintf("https://wa.me/%s?text=%s", formattedDoctorPhone, urlQueryEscape(docMsg))
	}

	return &response.FinishQueueResponse{
		ID:                partial.ID,
		Number:            partial.QueueNumber,
		PatientName:       patientName,
		NIK:               patientNIK,
		PhoneNumber:       patientPhone,
		Poli:              specialty,
		DoctorName:        doctorName,
		DoctorPhone:       doctorPhone,
		Status:            outcome,
		OutcomeNotes:      notes,
		MedicalRecordNo:   medicalRecordNo,
		FamilyPhoneNumber: targetFamilyPhone,
		FamilyName:        familyName,
		WhatsAppURL:       waURL,
		DoctorWhatsAppURL: docWaURL,
		UpdatedAt:         time.Now().UTC().Format("15:04:05"),
	}, nil
}

func formatWANumber(phone string) string {
	digits := ""
	for _, ch := range phone {
		if ch >= '0' && ch <= '9' {
			digits += string(ch)
		}
	}
	if strings.HasPrefix(digits, "0") {
		digits = "62" + digits[1:]
	} else if strings.HasPrefix(digits, "8") {
		digits = "62" + digits
	}
	return digits
}

func urlQueryEscape(s string) string {
	var b strings.Builder
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_' || c == '.' || c == '~' {
			b.WriteByte(c)
		} else if c == ' ' {
			b.WriteString("%20")
		} else if c == '\n' {
			b.WriteString("%0A")
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
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
