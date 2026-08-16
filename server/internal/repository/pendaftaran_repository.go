package repository

import (
	"fmt"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// PendaftaranRepository mengelola operasi database untuk tabel pendaftaran.
type PendaftaranRepository struct {
	db *sqlx.DB
}

// NewPendaftaranRepository membuat instance PendaftaranRepository baru.
func NewPendaftaranRepository(db *sqlx.DB) *PendaftaranRepository {
	return &PendaftaranRepository{db: db}
}

// Create menyimpan pendaftaran baru ke database.
func (r *PendaftaranRepository) Create(p *model.Pendaftaran) error {
	query := `INSERT INTO pendaftaran
	           (pasien_id, poli, dokter, tanggal, jam, jenis_pembayaran, nomor_antrian, qr_code, status)
	           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.Exec(query,
		p.PasienID, p.Poli, p.Dokter, p.Tanggal, p.Jam,
		p.JenisPembayaran, p.NomorAntrian, p.QRCode, p.Status,
	)
	if err != nil {
		return fmt.Errorf("create pendaftaran: %w", err)
	}
	return nil
}

// FindByPoliAndTanggal mengambil daftar antrian berdasarkan poli dan tanggal.
func (r *PendaftaranRepository) FindByPoliAndTanggal(poli, tanggal string) ([]model.Pendaftaran, error) {
	var list []model.Pendaftaran
	query := `SELECT pd.id, pd.pasien_id, pd.poli, pd.dokter, pd.tanggal, pd.jam,
	                 pd.jenis_pembayaran, pd.nomor_antrian, pd.qr_code, pd.status,
	                 pd.created_at, pd.updated_at
	           FROM pendaftaran pd
	           WHERE pd.poli = $1 AND pd.tanggal = $2
	           ORDER BY pd.nomor_antrian ASC`
	err := r.db.Select(&list, query, poli, tanggal)
	if err != nil {
		return nil, fmt.Errorf("find pendaftaran by poli: %w", err)
	}
	return list, nil
}

// CountByPoliAndTanggal menghitung jumlah pendaftaran pada poli dan tanggal tertentu.
func (r *PendaftaranRepository) CountByPoliAndTanggal(poli, tanggal string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM pendaftaran WHERE poli = $1 AND tanggal = $2`
	err := r.db.QueryRow(query, poli, tanggal).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count pendaftaran: %w", err)
	}
	return count, nil
}
