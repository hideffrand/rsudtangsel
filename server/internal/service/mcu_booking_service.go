package service

import (
	"errors"
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// Sentinel errors for MCU booking operations.
var (
	ErrMcuBookingNotFound    = errors.New("mcu booking not found")
	ErrMcuBookingPkgNotFound = errors.New("mcu package not found or inactive")
)

// Lab test prices in IDR (Rupiah).
// These are additive fees on top of the selected MCU package price.
var labTestPrices = map[string]int64{
	"hematologi":    50_000,
	"gula_darah":    25_000,
	"kolesterol":    35_000,
	"asam_urat":     30_000,
	"fungsi_hati":   75_000,
	"fungsi_ginjal": 75_000,
	"lipid":         60_000,
	"urinalisis":    30_000,
	"hormon":        150_000,
	"tes_kehamilan": 35_000,
}

// Radiology test prices in IDR (Rupiah).
var radiologyTestPrices = map[string]int64{
	"rontgen":    100_000,
	"usg":        150_000,
	"ct_scan":    500_000,
	"mri":        800_000,
	"mammografi": 200_000,
	"ekg":         85_000,
	"treadmill":  175_000,
}

// McuBookingService handles business logic for MCU booking registration.
type McuBookingService struct {
	bookingRepo *repository.McuBookingRepository
	packageRepo *repository.McuPackageRepository
	patientRepo *repository.PatientRepository
}

// NewMcuBookingService creates a new McuBookingService.
func NewMcuBookingService(
	bookingRepo *repository.McuBookingRepository,
	packageRepo *repository.McuPackageRepository,
	patientRepo *repository.PatientRepository,
) *McuBookingService {
	return &McuBookingService{
		bookingRepo: bookingRepo,
		packageRepo: packageRepo,
		patientRepo: patientRepo,
	}
}

// Register creates a new MCU booking.
// Business logic:
//  1. Validate that the package exists and is active.
//  2. Optionally link to an existing patient record by NIK.
//  3. Calculate total price (package base + add-on diagnostics).
//  4. Persist the booking and return the full detail response.
func (s *McuBookingService) Register(req request.McuBookingRequest) (*response.McuBookingResponse, error) {
	// 1. Verify MCU package
	pkg, err := s.packageRepo.FindByID(req.PackageID)
	if err != nil {
		return nil, fmt.Errorf("lookup package: %w", err)
	}
	if pkg == nil || !pkg.IsActive {
		return nil, ErrMcuBookingPkgNotFound
	}

	// 2. Look up existing patient by NIK (optional link - non-blocking)
	var patientID *int
	patient, _ := s.patientRepo.FindByNIK(req.NIK)
	if patient != nil {
		patientID = &patient.ID
	}

	// 3. Calculate total price
	totalPrice := calculateTotalPrice(pkg.Price, req.LabTests, req.RadiologyTests)

	// 4. Ensure slices are non-nil for pq.Array
	labTests := req.LabTests
	if labTests == nil {
		labTests = []string{}
	}
	radiologyTests := req.RadiologyTests
	if radiologyTests == nil {
		radiologyTests = []string{}
	}

	// 5. Build and persist booking
	booking := &model.McuBooking{
		PatientID:      patientID,
		PackageID:      req.PackageID,
		BookingDate:    req.BookingDate,
		BookingTime:    req.BookingTime,
		NIK:            req.NIK,
		FullName:       req.FullName,
		BirthDate:      req.BirthDate,
		PhoneNumber:    req.PhoneNumber,
		Address:        req.Address,
		LabTests:       labTests,
		RadiologyTests: radiologyTests,
		Status:         "pending",
		TotalPrice:     totalPrice,
		PaymentStatus:  "unpaid",
		PaymentMethod:  req.PaymentMethod,
		Notes:          req.Notes,
	}

	id, err := s.bookingRepo.Create(booking)
	if err != nil {
		return nil, fmt.Errorf("create mcu booking: %w", err)
	}

	return s.bookingRepo.FindByID(id)
}

// GetBooking returns the full detail of a single MCU booking.
func (s *McuBookingService) GetBooking(id int) (*response.McuBookingResponse, error) {
	b, err := s.bookingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, ErrMcuBookingNotFound
	}
	return b, nil
}

// GetPatientBookings returns all bookings for a patient identified by NIK (public endpoint).
func (s *McuBookingService) GetPatientBookings(nik string) ([]response.McuBookingListItem, error) {
	return s.bookingRepo.FindByNIK(nik)
}

// AdminGetBookings returns bookings, optionally filtered by status and/or date (admin endpoint).
func (s *McuBookingService) AdminGetBookings(status, date string) ([]response.McuBookingListItem, error) {
	return s.bookingRepo.FindAll(status, date)
}

// AdminUpdateBooking applies partial updates to a booking (status, payment_status, notes).
func (s *McuBookingService) AdminUpdateBooking(id int, req request.McuBookingAdminUpdateRequest) (*response.McuBookingResponse, error) {
	// Validate status values if provided
	if req.Status != nil {
		validStatuses := map[string]bool{"pending": true, "confirmed": true, "completed": true, "cancelled": true}
		if !validStatuses[*req.Status] {
			return nil, fmt.Errorf("invalid status: must be pending | confirmed | completed | cancelled")
		}
	}
	if req.PaymentStatus != nil {
		validPayment := map[string]bool{"unpaid": true, "awaiting_confirmation": true, "paid": true, "cancelled": true}
		if !validPayment[*req.PaymentStatus] {
			return nil, fmt.Errorf("invalid payment_status: must be unpaid | awaiting_confirmation | paid | cancelled")
		}
	}

	found, err := s.bookingRepo.AdminUpdate(id, req.Status, req.PaymentStatus, req.Notes)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, ErrMcuBookingNotFound
	}

	return s.bookingRepo.FindByID(id)
}

// GetRevenue returns the total revenue for paid MCU bookings in a date range.
func (s *McuBookingService) GetRevenue(startDate, endDate string) (int64, error) {
	return s.bookingRepo.GetRevenue(startDate, endDate)
}

// --- private helpers ---

// calculateTotalPrice computes: package base price + add-on lab fees + add-on radiology fees.
func calculateTotalPrice(basePrice int64, labTests, radiologyTests []string) int64 {
	total := basePrice
	for _, test := range labTests {
		if fee, ok := labTestPrices[test]; ok {
			total += fee
		}
	}
	for _, test := range radiologyTests {
		if fee, ok := radiologyTestPrices[test]; ok {
			total += fee
		}
	}
	return total
}
