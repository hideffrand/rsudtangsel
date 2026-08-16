package repository

import (
	"database/sql"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// McuBookingRepository handles all database operations for mcu_bookings.
type McuBookingRepository struct {
	db *sqlx.DB
}

// NewMcuBookingRepository creates a new McuBookingRepository.
func NewMcuBookingRepository(db *sqlx.DB) *McuBookingRepository {
	return &McuBookingRepository{db: db}
}

// dbRow is used for scanning joined rows (includes package_name).
type mcuBookingRow struct {
	model.McuBooking
	PackageName string `db:"package_name"`
}

// Create inserts a new MCU booking and returns its generated ID.
func (r *McuBookingRepository) Create(b *model.McuBooking) (int, error) {
	var id int
	query := `
		INSERT INTO mcu_bookings
		  (patient_id, package_id, booking_date, booking_time,
		   nik, full_name, birth_date, phone_number, address,
		   lab_tests, radiology_tests,
		   status, total_price, payment_status, payment_method, notes)
		VALUES
		  ($1, $2, $3, $4,
		   $5, $6, $7, $8, $9,
		   $10, $11,
		   $12, $13, $14, $15, $16)
		RETURNING id`
	err := r.db.QueryRow(query,
		b.PatientID, b.PackageID, b.BookingDate, b.BookingTime,
		b.NIK, b.FullName, b.BirthDate, b.PhoneNumber, b.Address,
		pq.Array(b.LabTests), pq.Array(b.RadiologyTests),
		b.Status, b.TotalPrice, b.PaymentStatus, b.PaymentMethod, b.Notes,
	).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create mcu booking: %w", err)
	}
	return id, nil
}

// FindByID returns a full booking detail (joined with mcu_packages).
// Returns nil if not found.
func (r *McuBookingRepository) FindByID(id int) (*response.McuBookingResponse, error) {
	query := `
		SELECT b.id, b.package_id, p.name AS package_name,
		       b.nik, b.full_name, b.phone_number, b.birth_date, b.address,
		       b.booking_date::text, b.booking_time::text,
		       b.lab_tests, b.radiology_tests,
		       b.status, b.total_price, b.payment_status, b.payment_method, b.notes,
		       TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		FROM mcu_bookings b
		JOIN mcu_packages p ON p.id = b.package_id
		WHERE b.id = $1`

	// Use raw sqlx query with pq.Array scanning
	rows, err := r.db.Queryx(query, id)
	if err != nil {
		return nil, fmt.Errorf("find mcu booking: %w", err)
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, nil // not found
	}

	var (
		labTests       pq.StringArray
		radiologyTests pq.StringArray
	)
	var resp response.McuBookingResponse
	err = rows.Scan(
		&resp.ID, &resp.PackageID, &resp.PackageName,
		&resp.NIK, &resp.FullName, &resp.PhoneNumber, &resp.BirthDate, &resp.Address,
		&resp.BookingDate, &resp.BookingTime,
		&labTests, &radiologyTests,
		&resp.Status, &resp.TotalPrice, &resp.PaymentStatus, &resp.PaymentMethod, &resp.Notes,
		&resp.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("scan mcu booking: %w", err)
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
func (r *McuBookingRepository) FindByNIK(nik string) ([]response.McuBookingListItem, error) {
	return r.findList("WHERE b.nik = $1 ORDER BY b.booking_date DESC, b.id DESC", nik)
}

// FindAll returns bookings optionally filtered by status and/or date.
// Pass empty strings to skip filters.
func (r *McuBookingRepository) FindAll(status, date string) ([]response.McuBookingListItem, error) {
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
func (r *McuBookingRepository) CountByDate(date string) (int, error) {
	var count int
	err := r.db.QueryRow(
		`SELECT COUNT(*) FROM mcu_bookings WHERE booking_date = $1`, date,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count mcu bookings by date: %w", err)
	}
	return count, nil
}

// GetRevenue returns the total revenue (sum of total_price) for paid bookings in a date range.
func (r *McuBookingRepository) GetRevenue(startDate, endDate string) (int64, error) {
	var total int64
	err := r.db.QueryRow(
		`SELECT COALESCE(SUM(total_price), 0)
		 FROM mcu_bookings
		 WHERE payment_status = 'paid'
		   AND booking_date BETWEEN $1 AND $2`,
		startDate, endDate,
	).Scan(&total)
	if err != nil {
		return 0, fmt.Errorf("get mcu revenue: %w", err)
	}
	return total, nil
}

// UpdateStatus updates the booking status. Returns false if booking not found.
func (r *McuBookingRepository) UpdateStatus(id int, status string) (bool, error) {
	res, err := r.db.Exec(
		`UPDATE mcu_bookings SET status = $1, updated_at = NOW() WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return false, fmt.Errorf("update mcu booking status: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// UpdatePaymentStatus updates only the payment_status field. Returns false if not found.
func (r *McuBookingRepository) UpdatePaymentStatus(id int, paymentStatus string) (bool, error) {
	res, err := r.db.Exec(
		`UPDATE mcu_bookings SET payment_status = $1, updated_at = NOW() WHERE id = $2`,
		paymentStatus, id,
	)
	if err != nil {
		return false, fmt.Errorf("update mcu payment status: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// AdminUpdate applies partial updates (status, payment_status, notes) from an admin patch.
func (r *McuBookingRepository) AdminUpdate(id int, status, paymentStatus, notes *string) (bool, error) {
	if status == nil && paymentStatus == nil && notes == nil {
		return false, fmt.Errorf("at least one field (status, payment_status, notes) must be provided")
	}

	query := `UPDATE mcu_bookings SET updated_at = NOW()`
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

// findList executes a list query (joined with mcu_packages) with an arbitrary WHERE clause.
func (r *McuBookingRepository) findList(whereClause string, args ...interface{}) ([]response.McuBookingListItem, error) {
	query := fmt.Sprintf(`
		SELECT b.id, p.name AS package_name,
		       b.full_name, b.nik, b.phone_number,
		       b.booking_date::text, b.booking_time::text,
		       b.status, b.total_price,
		       TO_CHAR(b.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
		FROM mcu_bookings b
		JOIN mcu_packages p ON p.id = b.package_id
		%s`, whereClause)

	rows, err := r.db.Queryx(query, args...)
	if err != nil {
		if err == sql.ErrNoRows {
			return []response.McuBookingListItem{}, nil
		}
		return nil, fmt.Errorf("list mcu bookings: %w", err)
	}
	defer rows.Close()

	var list []response.McuBookingListItem
	for rows.Next() {
		var item response.McuBookingListItem
		if err := rows.Scan(
			&item.ID, &item.PackageName,
			&item.FullName, &item.NIK, &item.PhoneNumber,
			&item.BookingDate, &item.BookingTime,
			&item.Status, &item.TotalPrice,
			&item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan mcu booking list row: %w", err)
		}
		list = append(list, item)
	}
	if list == nil {
		list = []response.McuBookingListItem{}
	}
	return list, nil
}
