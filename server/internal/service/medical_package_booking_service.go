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
	ErrMedicalPackageBookingNotFound    = errors.New("mcu booking not found")
	ErrMedicalPackageBookingPkgNotFound = errors.New("mcu package not found or inactive")
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

// MedicalPackageBookingService handles business logic for medical package booking registration.
type MedicalPackageBookingService struct {
	bookingRepo *repository.MedicalPackageBookingRepository
	packageRepo *repository.MedicalPackageRepository
	patientRepo *repository.PatientRepository
}

// NewMedicalPackageBookingService creates a new MedicalPackageBookingService.
func NewMedicalPackageBookingService(
	bookingRepo *repository.MedicalPackageBookingRepository,
	packageRepo *repository.MedicalPackageRepository,
	patientRepo *repository.PatientRepository,
) *MedicalPackageBookingService {
	return &MedicalPackageBookingService{
		bookingRepo: bookingRepo,
		packageRepo: packageRepo,
		patientRepo: patientRepo,
	}
}

// Register creates a new medical package booking.
// Business logic:
//  1. Validate that the package exists and is active.
//  2. Optionally link to an existing patient record by NIK.
//  3. Calculate total price (package base + add-on diagnostics).
//  4. Persist the booking and return the full detail response.
func (s *MedicalPackageBookingService) Register(req request.MedicalPackageBookingRequest) (*response.MedicalPackageBookingResponse, error) {
	// 1. Verify MCU package
	pkg, err := s.packageRepo.FindByID(req.PackageID)
	if err != nil {
		return nil, fmt.Errorf("lookup package: %w", err)
	}
	if pkg == nil || !pkg.IsActive {
		return nil, ErrMedicalPackageBookingPkgNotFound
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

	// 5. Generate unique booking number: {PREFIX}{DDMMYY}-{seq:03d}
	count, err := s.bookingRepo.CountByDate(req.BookingDate)
	if err != nil {
		return nil, fmt.Errorf("generate booking number: %w", err)
	}
	bookingNumber := generateMedicalPackageBookingNumber(pkg.Type, req.BookingDate, count+1)

	// 6. Build and persist booking
	booking := &model.MedicalPackageBooking{
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
		Status:      "pending",
		TotalPrice:  totalPrice,
		Notes:       req.Notes,
		BookingNumber: bookingNumber,
	}

	id, err := s.bookingRepo.Create(booking)
	if err != nil {
		return nil, fmt.Errorf("create medical package booking: %w", err)
	}

	return s.bookingRepo.FindByID(id)
}

// GetBooking returns the full detail of a single medical package booking.
func (s *MedicalPackageBookingService) GetBooking(id int) (*response.MedicalPackageBookingResponse, error) {
	b, err := s.bookingRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if b == nil {
		return nil, ErrMedicalPackageBookingNotFound
	}
	return b, nil
}

// GetPatientBookings returns all bookings for a patient identified by NIK (public endpoint).
func (s *MedicalPackageBookingService) GetPatientBookings(nik string) ([]response.MedicalPackageBookingListItem, error) {
	return s.bookingRepo.FindByNIK(nik)
}

// AdminGetBookings returns bookings, optionally filtered by status and/or date (admin endpoint).
func (s *MedicalPackageBookingService) AdminGetBookings(status, date string) ([]response.MedicalPackageBookingListItem, error) {
	return s.bookingRepo.FindAll(status, date)
}

// AdminUpdateBooking applies partial updates to a booking (status, notes).
func (s *MedicalPackageBookingService) AdminUpdateBooking(id int, req request.MedicalPackageBookingAdminUpdateRequest) (*response.MedicalPackageBookingResponse, error) {
	// Validate status values if provided
	if req.Status != nil {
		validStatuses := map[string]bool{"pending": true, "confirmed": true, "completed": true, "cancelled": true}
		if !validStatuses[*req.Status] {
			return nil, fmt.Errorf("invalid status: must be pending | confirmed | completed | cancelled")
		}
	}

	found, err := s.bookingRepo.AdminUpdate(id, req.Status, req.Notes)
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, ErrMedicalPackageBookingNotFound
	}

	return s.bookingRepo.FindByID(id)
}

// --- private helpers ---

// generateMedicalPackageBookingNumber generates a unique booking number.
// Format: {PREFIX}{DDMMYY}-{seq:03d}, e.g. MCU200826-001 / LAB230826-002.
// The prefix comes from the package type: mcu → MCU, lab → LAB, radiologi → RAD.
// seq is based on the count of bookings already registered for the same date + 1.
func generateMedicalPackageBookingNumber(packageType, bookingDate string, seq int) string {
	// bookingDate is "YYYY-MM-DD"; extract DD, MM, YY
	day, month, year := "00", "00", "00"
	if len(bookingDate) == 10 {
		day = bookingDate[8:10]
		month = bookingDate[5:7]
		year = bookingDate[2:4]
	}
	prefix := "PKG"
	switch packageType {
	case "mcu":
		prefix = "MCU"
	case "lab":
		prefix = "LAB"
	case "radiologi":
		prefix = "RAD"
	}
	return fmt.Sprintf("%s%s%s%s-%03d", prefix, day, month, year, seq)
}

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
