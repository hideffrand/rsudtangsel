package service

import (
	"errors"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrScheduleNotFound dikembalikan ketika jadwal dokter tidak ditemukan.
var ErrScheduleNotFound = errors.New("schedule not found")

// DoctorService menangani business logic untuk master data dokter dan jadwal dokter.
type DoctorService struct {
	doctorRepo   *repository.DoctorRepository
	scheduleRepo *repository.DoctorScheduleRepository
}

// NewDoctorService membuat instance DoctorService baru.
func NewDoctorService(
	doctorRepo *repository.DoctorRepository,
	scheduleRepo *repository.DoctorScheduleRepository,
) *DoctorService {
	return &DoctorService{
		doctorRepo:   doctorRepo,
		scheduleRepo: scheduleRepo,
	}
}

// GetAllDoctors mengembalikan semua dokter.
func (s *DoctorService) GetAllDoctors() ([]response.DoctorResponse, error) {
	doctors, err := s.doctorRepo.GetAll()
	if err != nil {
		return nil, err
	}
	list := make([]response.DoctorResponse, len(doctors))
	for i, d := range doctors {
		list[i] = toDoctorResponse(d)
	}
	return list, nil
}

// GetDoctor mengembalikan satu dokter berdasarkan ID. Mengembalikan nil jika tidak ditemukan.
func (s *DoctorService) GetDoctor(id int) (*response.DoctorResponse, error) {
	doctor, err := s.doctorRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if doctor == nil {
		return nil, nil
	}
	resp := toDoctorResponse(*doctor)
	return &resp, nil
}

// CreateDoctor membuat dokter baru.
func (s *DoctorService) CreateDoctor(req request.DoctorRequest) (*response.DoctorResponse, error) {
	doctor := &model.Doctor{
		Name:          req.Name,
		Specialty:     req.Specialty,
		LicenseNumber: req.LicenseNumber,
		Email:         req.Email,
		PhoneNumber:   req.PhoneNumber,
		Bio:           req.Bio,
		Status:        defaultDoctorStatus(req.Status),
	}
	id, err := s.doctorRepo.Create(doctor)
	if err != nil {
		return nil, err
	}
	return s.GetDoctor(id)
}

// UpdateDoctor memperbarui dokter.
func (s *DoctorService) UpdateDoctor(id int, req request.DoctorRequest) (*response.DoctorResponse, error) {
	doctor := &model.Doctor{
		ID:            id,
		Name:          req.Name,
		Specialty:     req.Specialty,
		LicenseNumber: req.LicenseNumber,
		Email:         req.Email,
		PhoneNumber:   req.PhoneNumber,
		Bio:           req.Bio,
		Status:        defaultDoctorStatus(req.Status),
	}
	updated, err := s.doctorRepo.Update(doctor)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrDoctorNotFound
	}
	return s.GetDoctor(id)
}

// DeleteDoctor menghapus dokter.
func (s *DoctorService) DeleteDoctor(id int) error {
	deleted, err := s.doctorRepo.Delete(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrDoctorNotFound
	}
	return nil
}

// defaultDoctorStatus mengembalikan "active" jika status tidak diisi.
func defaultDoctorStatus(status string) string {
	if status == "" {
		return "active"
	}
	return status
}

// GetAllSchedules mengembalikan semua jadwal dokter, opsional difilter per dokter.
func (s *DoctorService) GetAllSchedules(doctorID int) ([]response.DoctorScheduleResponse, error) {
	entries, err := s.scheduleRepo.FindAll(doctorID)
	if err != nil {
		return nil, err
	}
	return toScheduleResponses(entries), nil
}

// GetDoctorSchedules mengembalikan jadwal seorang dokter.
// Mengembalikan nil jika dokter tidak ditemukan.
func (s *DoctorService) GetDoctorSchedules(doctorID int) ([]response.DoctorScheduleResponse, error) {
	doctor, err := s.doctorRepo.FindByID(doctorID)
	if err != nil {
		return nil, err
	}
	if doctor == nil {
		return nil, nil
	}
	return s.GetAllSchedules(doctorID)
}

// CreateSchedule membuat jadwal dokter baru.
func (s *DoctorService) CreateSchedule(req request.ScheduleRequest) (*response.DoctorScheduleResponse, error) {
	doctor, err := s.doctorRepo.FindByID(req.DoctorID)
	if err != nil {
		return nil, err
	}
	if doctor == nil {
		return nil, ErrDoctorNotFound
	}

	schedule := &model.DoctorSchedule{
		DoctorID:   req.DoctorID,
		DayOfWeek:  req.DayOfWeek,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Quota:      defaultQuota(req.Quota),
	}
	id, err := s.scheduleRepo.Create(schedule)
	if err != nil {
		return nil, err
	}
	return s.GetSchedule(id)
}

// GetSchedule mengembalikan satu jadwal dokter. Mengembalikan nil jika tidak ditemukan.
func (s *DoctorService) GetSchedule(id int) (*response.DoctorScheduleResponse, error) {
	entry, err := s.scheduleRepo.FindEntryByID(id)
	if err != nil {
		return nil, err
	}
	if entry == nil {
		return nil, nil
	}
	resp := toScheduleResponse(*entry)
	return &resp, nil
}

// UpdateSchedule memperbarui jadwal dokter.
func (s *DoctorService) UpdateSchedule(id int, req request.ScheduleRequest) (*response.DoctorScheduleResponse, error) {
	doctor, err := s.doctorRepo.FindByID(req.DoctorID)
	if err != nil {
		return nil, err
	}
	if doctor == nil {
		return nil, ErrDoctorNotFound
	}

	schedule := &model.DoctorSchedule{
		ID:         id,
		DoctorID:   req.DoctorID,
		DayOfWeek:  req.DayOfWeek,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Quota:      defaultQuota(req.Quota),
	}
	updated, err := s.scheduleRepo.Update(schedule)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrScheduleNotFound
	}
	return s.GetSchedule(id)
}

// DeleteSchedule menghapus jadwal dokter.
func (s *DoctorService) DeleteSchedule(id int) error {
	deleted, err := s.scheduleRepo.Delete(id)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrScheduleNotFound
	}
	return nil
}

// defaultQuota mengembalikan 20 jika quota tidak diisi.
func defaultQuota(quota int) int {
	if quota == 0 {
		return 20
	}
	return quota
}

func toDoctorResponse(d model.Doctor) response.DoctorResponse {
	return response.DoctorResponse{
		ID:            d.ID,
		Name:          d.Name,
		Specialty:     d.Specialty,
		LicenseNumber: d.LicenseNumber,
		Email:         d.Email,
		PhoneNumber:   d.PhoneNumber,
		Bio:           d.Bio,
		Status:        d.Status,
	}
}

func toScheduleResponse(e repository.ScheduleEntry) response.DoctorScheduleResponse {
	return response.DoctorScheduleResponse{
		ID:         e.ID,
		DoctorID:   e.DoctorID,
		DoctorName: e.DoctorName,
		DayOfWeek:  e.DayOfWeek,
		StartTime:  e.StartTime,
		EndTime:    e.EndTime,
		Quota:      e.Quota,
	}
}

func toScheduleResponses(entries []repository.ScheduleEntry) []response.DoctorScheduleResponse {
	list := make([]response.DoctorScheduleResponse, len(entries))
	for i, e := range entries {
		list[i] = toScheduleResponse(e)
	}
	return list
}
