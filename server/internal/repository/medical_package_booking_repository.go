package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// MedicalPackageBookingRepository handles all database operations for medical_package_bookings.
type MedicalPackageBookingRepository struct {
	db *sqlx.DB
}

// NewMedicalPackageBookingRepository creates a new MedicalPackageBookingRepository.
func NewMedicalPackageBookingRepository(db *sqlx.DB) *MedicalPackageBookingRepository {
	return &MedicalPackageBookingRepository{db: db}
}

// dbRow is used for scanning joined rows (includes package_name).
type medicalPackageBookingRow struct {
	model.MedicalPackageBooking
	PackageName string `db:"package_name"`
}

// Create inserts a new medical package booking and returns its generated ID.
func (r *MedicalPackageBookingRepository) Create(b *model.MedicalPackageBooking) (int, error) {
	var id int
	query := `
		INSERT INTO medical_package_bookings
		  (patient_id, package_id, booking_date, booking_time,
		   nik, full_name, birth_date, phone_number, address,
		   lab_tests, radiology_tests,
		   status, total_price, payment_status, payment_method, notes, booking_number)
		VALUES
		  ($1, $2, $3, $4,
		   $5, $6, $7, $8, $9,
		   $10, $11,
		   $12, $13, $14, $15, $16, $17)
		RETURNING id`
	err := r.db.QueryRow(query,
		b.PatientID, b.PackageID, b.BookingDate, b.BookingTime,
		b.NIK, b.FullName, b.BirthDate, b.PhoneNumber, b.Address,
		pq.Array(b.LabTests), pq.Array(b.RadiologyTests),
		b.Status, b.TotalPrice, b.PaymentStatus, b.PaymentMethod, b.Notes, b.BookingNumber,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create medical package booking: %w", err)
	}
	return id, nil
}

// FindByID returns a full booking detail (joined with medical_packages).
// Returns nil if not found.
func (r *MedicalPackageBookingRepository) FindByID(id int) (*response.MedicalPackageBookingResponse, error) {
	query := `
		SELECT b.id, COALESCE(b.booking_number, ''), b.package_id, p.name AS package_name,
		       b.nik, b.full_name, b.phone_number, b.birth_date, b.address,
		       b.booking_date::text, b.booking_time::text,
		       b.lab_tests, b.radiology_tests,
		       b.status, b.total_price, b.payment_status, b.payment_method, b.notes,
		       TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		FROM medical_package_bookings b
		JOIN medical_packages p ON p.id = b.package_id
		WHERE b.id = $1`

	// Use raw sqlx query with pq.Array scanning
	rows, err := r.db.Queryx(query, id)
	if err != nil {
		return nil, fmt.Errorf("find medical package booking: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, nil // not found
	}

	var (
		labTests       pq.StringArray
		radiologyTests pq.StringArray
	)
	var resp response.MedicalPackageBookingResponse
	err = rows.Scan(
		&resp.ID, &resp.BookingNumber, &resp.PackageID, &resp.PackageName,
		&resp.NIK, &resp.FullName, &resp.PhoneNumber, &resp.BirthDate, &resp.Address,
		&resp.BookingDate, &resp.BookingTime,
		&labTests, &radiologyTests,
		&resp.Status, &resp.TotalPrice, &resp.PaymentStatus, &resp.PaymentMethod, &resp.Notes,
		&resp.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan medical package booking: %w", err)
	}
	resp.LabTests = []string(labTests)
	resp.RadiologyTests = []string(radiologyTests)
	if resp.LabTests == nil {
		resp.LabTests = []string{}
	}
	if resp.RadiologyTests == nil {
		resp.RadiologyTests = []string{}
	}
	return &resp, nil
}

// FindByNIK returns all bookings for a patient identified by NIK.
func (r *MedicalPackageBookingRepository) FindByNIK(nik string) ([]response.MedicalPackageBookingListItem, error) {
	return r.findList("WHERE b.nik = $1 ORDER BY b.booking_date DESC, b.id DESC", nik)
}

// FindAll returns bookings optionally filtered by status and/or date.
// Pass empty strings to skip filters.
func (r *MedicalPackageBookingRepository) FindAll(status, date string) ([]response.MedicalPackageBookingListItem, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	idx := 1

	if status != "" {
		where += fmt.Sprintf(" AND b.status = $%d", idx)
		args = append(args, status)
		idx++
	}
	if date != "" {
		where += fmt.Sprintf(" AND b.booking_date = $%d", idx)
		args = append(args, date)
		idx++
	}

	return r.findList(where+" ORDER BY b.booking_date DESC, b.id DESC", args...)
}

// CountByDate counts the total number of MCU bookings for a given date.
func (r *MedicalPackageBookingRepository) CountByDate(date string) (int, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM medical_package_bookings WHERE booking_date = $1`, date,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count medical package bookings by date: %w", err)
	}
	return count, nil
}

// GetRevenue returns the total revenue (sum of total_price) for paid bookings in a date range.
func (r *MedicalPackageBookingRepository) GetRevenue(startDate, endDate string) (int64, error) {
	var total int64
	err := r.db.QueryRow(
		`SELECT COALESCE(SUM(total_price), 0)
		 FROM medical_package_bookings
		 WHERE payment_status = 'paid'
		   AND booking_date BETWEEN $1 AND $2`,
		startDate, endDate,
	).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("get medical package booking revenue: %w", err)
	}
	return total, nil
}

// UpdateStatus updates the booking status. Returns false if booking not found.
func (r *MedicalPackageBookingRepository) UpdateStatus(id int, status string) (bool, error) {
	res, err := r.db.Exec(
		`UPDATE medical_package_bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return false, fmt.Errorf("update medical package booking status: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// UpdatePaymentStatus updates only the payment_status field. Returns false if not found.
func (r *MedicalPackageBookingRepository) UpdatePaymentStatus(id int, paymentStatus string) (bool, error) {
	res, err := r.db.Exec(
		`UPDATE medical_package_bookings SET payment_status = $1, updated_at = NOW() WHERE id = $2`,
		paymentStatus, id,
	)
	if err != nil {
		return false, fmt.Errorf("update medical package payment status: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// AdminUpdate applies partial updates (status, payment_status, notes) from an admin patch.
func (r *MedicalPackageBookingRepository) AdminUpdate(id int, status, paymentStatus, notes *string) (bool, error) {
	if status == nil && paymentStatus == nil && notes == nil {
		return false, fmt.Errorf("at least one field (status, payment_status, notes) must be provided")
	}

	query := `UPDATE medical_package_bookings SET updated_at = NOW()`
	args := []interface{}{}
	idx := 1

	if status != nil {
		query += fmt.Sprintf(", status = $%d", idx)
		args = append(args, *status)
		idx++
	}
	if paymentStatus != nil {
		query += fmt.Sprintf(", payment_status = $%d", idx)
		args = append(args, *paymentStatus)
		idx++
	}
	if notes != nil {
		query += fmt.Sprintf(", notes = $%d", idx)
		args = append(args, *notes)
		idx++
	}

	query += fmt.Sprintf(" WHERE id = $%d", idx)
	args = append(args, id)

	res, err := r.db.Exec(query, args...)
	if err != nil {
		return false, fmt.Errorf("admin update mcu booking: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// --- private helpers ---

// findList executes a list query (joined with medical_packages) with an arbitrary WHERE clause.
func (r *MedicalPackageBookingRepository) findList(whereClause string, args ...interface{}) ([]response.MedicalPackageBookingListItem, error) {
	query := fmt.Sprintf(`
		SELECT b.id, COALESCE(b.booking_number, ''), p.name AS package_name,
		       b.full_name, b.nik, b.phone_number,
		       b.booking_date::text, b.booking_time::text,
		       b.status, b.total_price,
		       TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		FROM medical_package_bookings b
		JOIN medical_packages p ON p.id = b.package_id
		%s`, whereClause)

	rows, err := r.db.Queryx(query, args...)
	if err != nil {
		if err == sql.ErrNoRows {
			return []response.MedicalPackageBookingListItem{}, nil
		}
		return nil, fmt.Errorf("list mcu bookings: %w", err)
	}
	defer rows.Close()

	var list []response.MedicalPackageBookingListItem
	for rows.Next() {
		var item response.MedicalPackageBookingListItem
		if err := rows.Scan(
			&item.ID, &item.BookingNumber, &item.PackageName,
			&item.FullName, &item.NIK, &item.PhoneNumber,
			&item.BookingDate, &item.BookingTime,
			&item.Status, &item.TotalPrice,
			&item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan medical package booking list row: %w", err)
		}
		list = append(list, item)
	}
	if list == nil {
		list = []response.MedicalPackageBookingListItem{}
	}
	return list, nil
}
