package service

import (
	"fmt"
	"net/url"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/dto/request"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// AntrianService menangani business logic untuk pendaftaran dan antrian.
type AntrianService struct {
	pasienRepo      *repository.PasienRepository
	pendaftaranRepo *repository.PendaftaranRepository
}

// NewAntrianService membuat instance AntrianService baru.
func NewAntrianService(
	pasienRepo *repository.PasienRepository,
	pendaftaranRepo *repository.PendaftaranRepository,
) *AntrianService {
	return &AntrianService{
		pasienRepo:      pasienRepo,
		pendaftaranRepo: pendaftaranRepo,
	}
}

// DaftarOnline memproses pendaftaran pasien dan mengembalikan nomor antrian.
func (s *AntrianService) DaftarOnline(req request.DaftarOnlineRequest) (*response.DaftarOnlineResponse, error) {
	// 1. Cek apakah pasien sudah ada berdasarkan NIK
	pasien, err := s.pasienRepo.FindByNIK(req.NIK)
	if err != nil {
		return nil, fmt.Errorf("cek pasien: %w", err)
	}

	var pasienID int

	if pasien == nil {
		// 2. Pasien belum ada — parse tanggal lahir dan buat pasien baru
		tanggalLahir, err := parseTanggal(req.TanggalLahir)
		if err != nil {
			tanggalLahir = time.Now() // fallback jika tidak diisi
		}

		newPasien := &model.Pasien{
			NIK:          req.NIK,
			Nama:         req.Nama,
			TanggalLahir: tanggalLahir,
			Alamat:       req.Alamat,
			NoHP:         req.NoHP,
		}
		pasienID, err = s.pasienRepo.Create(newPasien)
		if err != nil {
			return nil, fmt.Errorf("buat pasien: %w", err)
		}
	} else {
		pasienID = pasien.ID
	}

	// 3. Generate nomor antrian berdasarkan jumlah pendaftaran di poli + tanggal yang sama
	count, err := s.pendaftaranRepo.CountByPoliAndTanggal(req.Poli, req.Tanggal)
	if err != nil {
		return nil, fmt.Errorf("hitung antrian: %w", err)
	}
	nomorAntrian := generateNomorAntrian(req.Poli, count+1)

	// 4. Generate QR code URL
	qrCode := generateQRCodeURL(nomorAntrian)

	// 5. Tentukan jam default jika kosong
	jam := req.Jam
	if jam == "" {
		jam = "08:00"
	}

	// 6. Tentukan dokter default jika kosong
	dokter := req.Dokter
	if dokter == "" {
		dokter = "Dokter Umum"
	}

	// 7. Parse tanggal pendaftaran
	tanggal, err := parseTanggal(req.Tanggal)
	if err != nil {
		return nil, fmt.Errorf("format tanggal tidak valid (gunakan YYYY-MM-DD): %w", err)
	}

	// 8. Simpan pendaftaran
	pendaftaran := &model.Pendaftaran{
		PasienID:        pasienID,
		Poli:            req.Poli,
		Dokter:          dokter,
		Tanggal:         tanggal,
		Jam:             jam,
		JenisPembayaran: req.JenisPembayaran,
		NomorAntrian:    nomorAntrian,
		QRCode:          qrCode,
		Status:          "menunggu",
	}
	if err := s.pendaftaranRepo.Create(pendaftaran); err != nil {
		return nil, fmt.Errorf("simpan pendaftaran: %w", err)
	}

	return &response.DaftarOnlineResponse{
		NomorAntrian: nomorAntrian,
		QRCode:       qrCode,
		Pesan:        fmt.Sprintf("Pendaftaran berhasil! Nomor antrian Anda: %s", nomorAntrian),
	}, nil
}

// CekAntrian mengembalikan daftar antrian untuk poli dan tanggal tertentu.
func (s *AntrianService) CekAntrian(poli, tanggal string) ([]response.AntrianItem, error) {
	// Gunakan tanggal hari ini jika tidak disertakan
	if tanggal == "" {
		tanggal = time.Now().Format("2006-01-02")
	}

	list, err := s.pendaftaranRepo.FindByPoliAndTanggal(poli, tanggal)
	if err != nil {
		return nil, fmt.Errorf("cek antrian: %w", err)
	}

	// Kita perlu nama pasien — ambil dari join atau buat struct sementara
	// Untuk saat ini gunakan pasien_id sebagai placeholder (bisa di-enhance dengan JOIN)
	items := make([]response.AntrianItem, len(list))
	for i, p := range list {
		items[i] = response.AntrianItem{
			Nomor:  p.NomorAntrian,
			Nama:   fmt.Sprintf("Pasien #%d", p.PasienID),
			Status: capitalizeStatus(p.Status),
		}
	}

	return items, nil
}

// --- Private helpers ---

// generateNomorAntrian menghasilkan nomor antrian format "A001" berdasarkan huruf poli dan urutan.
func generateNomorAntrian(poli string, urutan int) string {
	prefix := "A"
	if len(poli) > 0 {
		prefix = string([]rune(poli)[0])
	}
	return fmt.Sprintf("%s%03d", prefix, urutan)
}

// generateQRCodeURL menghasilkan URL QR code dari nomor antrian.
func generateQRCodeURL(nomorAntrian string) string {
	return "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + url.QueryEscape(nomorAntrian)
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
