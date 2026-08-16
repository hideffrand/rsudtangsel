package service

import (
	"fmt"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// DashboardService menangani business logic untuk statistik dashboard admin.
type DashboardService struct {
	appointmentRepo *repository.AppointmentRepository
}

// NewDashboardService membuat instance DashboardService baru.
func NewDashboardService(appointmentRepo *repository.AppointmentRepository) *DashboardService {
	return &DashboardService{appointmentRepo: appointmentRepo}
}

// GetStats mengembalikan statistik dashboard untuk hari ini.
func (s *DashboardService) GetStats() (*response.DashboardStatsResponse, error) {
	today := time.Now().Format("2006-01-02")

	// 1. Hitung jumlah pasien unik hari ini
	pasienHariIni, err := s.appointmentRepo.CountPatientsByDate(today)
	if err != nil {
		return nil, fmt.Errorf("hitung pasien hari ini: %w", err)
	}

	// 2. Rata-rata waktu tunggu (menit) untuk appointment yang sudah selesai
	rataWaktuTunggu, err := s.appointmentRepo.AvgWaitingTime(today)
	if err != nil {
		return nil, fmt.Errorf("hitung rata waktu tunggu: %w", err)
	}

	// 3. Total antrian yang masih menunggu hari ini
	totalAntrian, err := s.appointmentRepo.CountWaitingToday(today)
	if err != nil {
		return nil, fmt.Errorf("hitung total antrian: %w", err)
	}

	// 4. BOR (Bed Occupancy Rate) — mock karena belum ada tabel beds
	// TODO: Ganti dengan query nyata ketika tabel beds tersedia
	bor := 75.0

	// 5. Keluhan baru — mock karena belum ada tabel keluhan
	// TODO: Ganti dengan query nyata ketika tabel keluhan tersedia
	keluhanBaru := 12

	return &response.DashboardStatsResponse{
		PasienHariIni:   pasienHariIni,
		RataWaktuTunggu: roundFloat(rataWaktuTunggu, 1),
		BOR:             bor,
		KeluhanBaru:     keluhanBaru,
		TotalAntrian:    totalAntrian,
		UpdateTime:      time.Now().UTC().Format("15:04:05"),
	}, nil
}

// roundFloat membulatkan float64 ke n desimal.
func roundFloat(val float64, precision int) float64 {
	if precision == 0 {
		return float64(int(val + 0.5))
	}
	factor := 1.0
	for i := 0; i < precision; i++ {
		factor *= 10
	}
	return float64(int(val*factor+0.5)) / factor
}
