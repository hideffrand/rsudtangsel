package service

import (
	"fmt"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// DashboardService handles business logic for the admin dashboard statistics.
type DashboardService struct {
	appointmentRepo *repository.AppointmentRepository
}

// NewDashboardService creates a new DashboardService instance.
func NewDashboardService(appointmentRepo *repository.AppointmentRepository) *DashboardService {
	return &DashboardService{appointmentRepo: appointmentRepo}
}

// GetStats returns aggregated dashboard statistics for the current day.
func (s *DashboardService) GetStats() (*response.DashboardStatsResponse, error) {
	today := time.Now().Format("2006-01-02")

	// 1. Count unique patients registered today
	patientCount, err := s.appointmentRepo.CountPatientsByDate(today)
	if err != nil {
		return nil, fmt.Errorf("count patients today: %w", err)
	}

	// 2. Average waiting time (minutes) for completed appointments today
	avgWaitingTime, err := s.appointmentRepo.AvgWaitingTime(today)
	if err != nil {
		return nil, fmt.Errorf("calculate avg waiting time: %w", err)
	}

	// 3. Total appointments still in 'waiting' status today
	totalWaiting, err := s.appointmentRepo.CountWaitingToday(today)
	if err != nil {
		return nil, fmt.Errorf("count waiting appointments: %w", err)
	}

	// 4. BOR (Bed Occupancy Rate) - mocked until a beds table is available
	// TODO: replace with a real query once the beds table is added
	bor := 75.0

	// 5. New complaints - mocked until a complaints table is available
	// TODO: replace with a real query once the complaints table is added
	newComplaints := 12

	// 6. Count distinct active doctors today
	activeDoctors, err := s.appointmentRepo.CountActiveDoctors(today)
	if err != nil {
		return nil, fmt.Errorf("count active doctors: %w", err)
	}

	return &response.DashboardStatsResponse{
		PatientsToday:   patientCount,
		AverageWaitTime: roundFloat(avgWaitingTime, 1),
		BOR:             bor,
		NewComplaints:   newComplaints,
		TotalQueue:      totalWaiting,
		ActiveDoctors:   activeDoctors,
		UpdateTime:      time.Now().UTC().Format("15:04:05"),
	}, nil
}

// roundFloat rounds a float64 to the given number of decimal places.
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
