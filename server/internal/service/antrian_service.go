package service

import (
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrDoctorNotFound dikembalikan ketika dokter tidak ditemukan di master data.
var ErrDoctorNotFound = errors.New("doctor not found")

// AntrianService menangani business logic untuk pendaftaran dan antrian.
type AntrianService struct {
	patientRepo     *repository.PatientRepository
	doctorRepo      *repository.DoctorRepository
	appointmentRepo *repository.AppointmentRepository
}

// NewAntrianService membuat instance AntrianService baru.
func NewAntrianService(
	patientRepo *repository.PatientRepository,
	doctorRepo *repository.DoctorRepository,
	appointmentRepo *repository.AppointmentRepository,
) *AntrianService {
	return &AntrianService{
		patientRepo:     patientRepo,
		doctorRepo:      doctorRepo,
		appointmentRepo: appointmentRepo,
	}
}

// DaftarOnline memproses pendaftaran pasien dan mengembalikan nomor antrian.
func (s *AntrianService) DaftarOnline(req request.DaftarOnlineRequest) (*response.DaftarOnlineResponse, error) {
	// 1. Cek apakah pasien sudah ada berdasarkan NIK
	patient, err := s.patientRepo.FindByNIK(req.NIK)
	if err != nil {
		return nil, fmt.Errorf("cek pasien: %w", err)
	}

	var patientID int
	if patient == nil {
		// 2. Pasien belum ada — buat baru
		birthDate, err := parseTanggal(req.BirthDate)
		if err != nil {
			birthDate = time.Now() // fallback jika tidak diisi
		}
		newPatient := &model.Patient{
			NIK:         req.NIK,
			Name:        req.Name,
			BirthDate:   birthDate,
			Address:     req.Address,
			PhoneNumber: req.PhoneNumber,
		}
		patientID, err = s.patientRepo.Create(newPatient)
		if err != nil {
			return nil, fmt.Errorf("buat pasien: %w", err)
		}
	} else {
		patientID = patient.ID
	}

	// 3. Ambil dokter dari master data
	doctor, err := s.doctorRepo.FindByID(req.DoctorID)
	if err != nil {
		return nil, fmt.Errorf("ambil dokter: %w", err)
	}
	if doctor == nil {
		return nil, ErrDoctorNotFound
	}

	// 4. Generate nomor antrian berdasarkan spesialisasi dokter + tanggal yang sama
	count, err := s.appointmentRepo.CountByDepartmentAndDate(doctor.Specialty, req.ScheduleDate)
	if err != nil {
		return nil, fmt.Errorf("hitung antrian: %w", err)
	}
	queueNumber := generateQueueNumber(doctor.Specialty, count+1)

	// 5. Generate QR code URL
	qrCode := generateQRCodeURL(queueNumber)

	// 6. Tentukan jam default jika kosong
	timeOfDay := req.Time
	if timeOfDay == "" {
		timeOfDay = "08:00"
	}

	// 7. Parse tanggal pendaftaran
	scheduleDate, err := parseTanggal(req.ScheduleDate)
	if err != nil {
		return nil, fmt.Errorf("format tanggal tidak valid (gunakan YYYY-MM-DD): %w", err)
	}

	// 8. Simpan pendaftaran
	appointment := &model.Appointment{
		PatientID:    patientID,
		DoctorID:     doctor.ID,
		ScheduleDate: scheduleDate,
		Time:         timeOfDay,
		PaymentType:  req.PaymentType,
		QueueNumber:  queueNumber,
		QRCode:       qrCode,
		Status:       "waiting",
	}
	if err := s.appointmentRepo.Create(appointment); err != nil {
		return nil, fmt.Errorf("simpan pendaftaran: %w", err)
	}

	return &response.DaftarOnlineResponse{
		QueueNumber: queueNumber,
		QRCode:      qrCode,
		Message:     fmt.Sprintf("Pendaftaran berhasil! Nomor antrian Anda: %s", queueNumber),
	}, nil
}

// CekAntrian mengembalikan daftar antrian untuk spesialisasi dan tanggal tertentu.
func (s *AntrianService) CekAntrian(department, scheduleDate string) ([]response.AntrianItem, error) {
	// Gunakan tanggal hari ini jika tidak disertakan
	if scheduleDate == "" {
		scheduleDate = time.Now().Format("2006-01-02")
	}

	entries, err := s.appointmentRepo.FindByDepartmentAndDate(department, scheduleDate)
	if err != nil {
		return nil, fmt.Errorf("cek antrian: %w", err)
	}

	items := make([]response.AntrianItem, len(entries))
	for i, e := range entries {
		items[i] = response.AntrianItem{
			Number: e.QueueNumber,
			Name:   e.PatientName,
			Status: capitalizeStatus(e.Status),
		}
	}

	return items, nil
}

// --- Private helpers ---

// generateQueueNumber menghasilkan nomor antrian format "A001" berdasarkan huruf spesialisasi dan urutan.
func generateQueueNumber(specialty string, urutan int) string {
	prefix := "A"
	if len(specialty) > 0 {
		prefix = string([]rune(specialty)[0])
	}
	return fmt.Sprintf("%s%03d", prefix, urutan)
}

// generateQRCodeURL menghasilkan URL QR code dari nomor antrian.
func generateQRCodeURL(queueNumber string) string {
	return "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + url.QueryEscape(queueNumber)
}

// parseTanggal mengurai string tanggal format "YYYY-MM-DD".
func parseTanggal(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

// capitalizeStatus mengubah status lowercase menjadi kapital di depan.
func capitalizeStatus(status string) string {
	if len(status) == 0 {
		return status
	}
	return string([]rune(status)[0]-32) + status[1:]
}
