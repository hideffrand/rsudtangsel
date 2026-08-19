package service

import (
	"errors"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// ErrPoliklinikNotFound dikembalikan ketika poliklinik tidak ditemukan.
var ErrPoliklinikNotFound = errors.New("poliklinik not found")

// PoliklinikService menangani business logic untuk master data poliklinik (poli).
type PoliklinikService struct {
	poliRepo *repository.PoliklinikRepository
}

// NewPoliklinikService membuat instance PoliklinikService baru.
func NewPoliklinikService(poliRepo *repository.PoliklinikRepository) *PoliklinikService {
	return &PoliklinikService{poliRepo: poliRepo}
}

// GetAllPolis mengembalikan semua poliklinik.
func (s *PoliklinikService) GetAllPolis() ([]response.PoliklinikResponse, error) {
	polis, err := s.poliRepo.FindAll()
	if err != nil {
		return nil, err
	}
	list := make([]response.PoliklinikResponse, len(polis))
	for i, p := range polis {
		list[i] = toPoliklinikResponse(p)
	}
	return list, nil
}

// GetPoli mengembalikan satu poliklinik berdasarkan ID. Mengembalikan nil jika tidak ditemukan.
func (s *PoliklinikService) GetPoli(id int) (*response.PoliklinikResponse, error) {
	poli, err := s.poliRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if poli == nil {
		return nil, nil
	}
	resp := toPoliklinikResponse(*poli)
	return &resp, nil
}

// FindOrCreatePoliID mengembalikan ID poliklinik berdasarkan nama, membuat baru jika belum ada.
// Dipakai oleh DoctorService saat menyimpan dokter agar poli_id selalu tersinkron dengan specialty.
func (s *PoliklinikService) FindOrCreatePoliID(name string) (int, error) {
	return s.poliRepo.FindOrCreateByName(name)
}

func toPoliklinikResponse(p model.Poliklinik) response.PoliklinikResponse {
	return response.PoliklinikResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
	}
}
