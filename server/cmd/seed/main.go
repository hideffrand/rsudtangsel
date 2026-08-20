package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/hideffrand/rsudtangsel/server/internal/database"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
)

// Seeder utama: (1) jadwal dokter dari CSV ke tabel poliklinik, doctors, dan doctor_schedules,
// (2) katalog layanan (mcu_packages + diagnostic_services).
// Cara pakai: cd server && make seed (atau go run ./cmd/seed)
// CSV jadwal diambil dari SCHEDULE_CSV env (default: ../jadwal_dokter.csv).
// PERHATIAN: bagian jadwal dokter TRUNCATE doctors & poliklinik CASCADE — menghapus isi doctors,
// doctor_schedules, appointments, dan poliklinik (relasi dokter-ke-poli dibangun ulang dari CSV).
// Bagian katalog idempotent — tidak menghapus baris; ID paket dipertahankan agar FK mcu_bookings
// tidak putus.

const dayColumns = 6 // SENIN..SABTU

var days = []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}

type catalogService struct {
	category    string
	name        string
	description string
	price       int64
	items       []string
}

var mcuServices = []catalogService{
	{"mcu", "Paket MCU Hemat", "Pemeriksaan kesehatan dasar hemat & efisien bagi individu.", 250000,
		[]string{"Pemeriksaan Fisik Dokter Umum", "Hematologi Rutin (Hb, Leukosit, Trombosit)", "Urine Lengkap"}},
	{"mcu", "Paket MCU Pelajar", "Khusus untuk syarat pendaftaran sekolah, kuliah, atau bebas narkoba.", 300000,
		[]string{"Fisik & Visus Mata", "Tes Bebas Narkoba 5 Parameter", "Surat Keterangan Sehat Pelajar"}},
	{"mcu", "Paket MCU Pegawai", "Persyaratan tes kesehatan CPNS, BUMN, dan karyawan perusahaan.", 450000,
		[]string{"Rontgen Thorax Digital", "Tes Bebas Narkoba 6 Parameter", "EKG Jantung Dasar", "Fisik Dokter Umum"}},
	{"mcu", "Paket MCU Calon Pengantin", "Pemeriksaan pranikah (Premarital Check Up) bagi calon pengantin.", 650000,
		[]string{"Golongan Darah & Rhesus", "Skrining Thalassemia & Anemia", "HBsAg & HIV", "Skrining Kebidanan / Urologi"}},
	{"mcu", "Paket MCU ROHAJJ (Haji / Umroh)", "Pemeriksaan kesehatan istitha'ah untuk calon jemaah Haji & Umroh.", 750000,
		[]string{"Rontgen Thorax & EKG Jantung", "Laboratorium Darah Lengkap", "Tes Kehamilan (Wanita)", "Vaksin Meningitis & Influenza"}},
	{"mcu", "Paket MCU Silver Eksekutif", "Paket skrining organ penting bagi dewasa muda.", 850000,
		[]string{"Laboratorium Darah & Urine Lengkap", "Fungsi Hati & Ginjal (Ureum, Kreatinin)", "Profil Kolesterol & Gula Darah", "Rontgen Thorax"}},
	{"mcu", "Paket MCU Gold Eksekutif", "Skrining kesehatan eksekutif menengah organ dalam.", 1350000,
		[]string{"Seluruh Fasilitas MCU Silver", "USG Abdomen / Perut", "Treadmill Test Jantung", "Konsultasi Dokter Spesialis Penyakit Dalam"}},
	{"mcu", "Paket MCU Platinum Eksekutif", "Skrining komprehensif organ dalam & penanda tumor.", 2100000,
		[]string{"Seluruh Fasilitas MCU Gold", "Tumor Marker (CEA & AFP)", "CT-Scan Thorax / USG Mammografi", "Pemeriksaan Mata & THT"}},
	{"mcu", "Paket MCU Titanium VVIP", "Paket kualitatif terlengkap VVIP RSU Tangsel Care.", 3500000,
		[]string{"Seluruh Fasilitas MCU Platinum", "MRI 1.5 Tesla organ pilihan", "Ekokardiografi Jantung", "Kamar Rawat Transit VVIP 1 Hari"}},
	{"mcu", "Paket MCU Jantung Sehat", "Skrining khusus kebugaran & potensi penyakit jantung koronari.", 1200000,
		[]string{"EKG Jantung 12 Lead", "Treadmill Stress Test", "Ekokardiografi USG Jantung", "Profil Lipid Lengkap & Konsultasi Spesialis Jantung"}},
}

var diagnosticServices = []catalogService{
	{"lab", "Complete Blood Count (Hematologi Rutin)", "Pemeriksaan hemoglobin, leukosit, hematokrit, trombosit, dan eritrosit.", 134900,
		[]string{"Hemoglobin (Hb)", "Leukosit", "Trombosit", "Hematokrit", "Eritrosit"}},
	{"lab", "Paket Cek Diabetes & Gula Darah", "Skrining kadar gula darah puasa, 2 jam PP, dan HbA1c.", 325650,
		[]string{"Gula Darah Puasa", "Gula Darah 2 Jam PP", "HbA1c (Rata-rata Gula Darah 3 Bulan)"}},
	{"lab", "Tes Fungsi Hati (SGOT & SGPT)", "Pemeriksaan enzim hati untuk mendeteksi peradangan atau hepatitis.", 188700,
		[]string{"SGOT (AST)", "SGPT (ALT)"}},
	{"lab", "Tes Fungsi Ginjal (Ureum & Kreatinin)", "Pemeriksaan laju penyaringan ginjal dan pembuangan sisa asam urat/ureum.", 195000,
		[]string{"Ureum", "Kreatinin", "Asam Urat"}},
	{"radiologi", "Cek Rontgen Thorax Digital", "Foto rontgen paru-paru dan jantung digital dosis radiasi rendah.", 220000,
		[]string{"Foto X-Ray Thorax PA / AP", "Bacaan Dokter Spesialis Radiologi"}},
	{"radiologi", "Cek USG Abdomen Abdominal 4D", "Pemeriksaan ultrasonografi organ perut (hati, empedu, ginjal, limpa, kandung kemih).", 480000,
		[]string{"USG Perut / Abdomen Utuh", "Bacaan Dokter Spesialis Radiologi"}},
	{"radiologi", "Cek MRI 1.5 Tesla Kepala / Otak", "Pencitraan MRI jaringan otak presisi tinggi untuk deteksi stroke atau kelainan saraf.", 2400000,
		[]string{"Scan MRI Brain 1.5 Tesla", "Bacaan Dokter Spesialis Radiologi"}},
}

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	csvPath := os.Getenv("SCHEDULE_CSV")
	if csvPath == "" {
		csvPath = "../jadwal_dokter.csv"
	}

	db, err := database.Connect(databaseURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer db.Close()

	poliCount, doctorCount, scheduleCount, err := seedDoctorSchedules(db, csvPath)
	if err != nil {
		log.Fatal(err)
	}
	if err := seedMcuPackages(db); err != nil {
		log.Fatalf("seed mcu packages: %v", err)
	}
	if err := seedDiagnosticServices(db); err != nil {
		log.Fatalf("seed diagnostic services: %v", err)
	}

	fmt.Printf("Seeder selesai: %d poliklinik, %d dokter, %d jadwal, %d MCU, %d layanan diagnostik.\n",
		poliCount, doctorCount, scheduleCount, len(mcuServices), len(diagnosticServices))
}

// seedDoctorSchedules TRUNCATE doctors & poliklinik lalu membangun ulang dari CSV jadwal.
// Poliklinik dipakai sebagai master data (normalized): baris poliklinik di-find-or-create
// berdasarkan nama hasil normalisasi kolom "Poliklinik", lalu dokter ditautkan ke poli lewat
// doctors.poli_id — bukan nama poli yang di-hardcode.
func seedDoctorSchedules(db *sqlx.DB, csvPath string) (poliCount, doctorCount, scheduleCount int, err error) {
	if _, err := db.Exec("TRUNCATE doctors RESTART IDENTITY CASCADE"); err != nil {
		return 0, 0, 0, fmt.Errorf("truncate doctors: %w", err)
	}
	if _, err := db.Exec("TRUNCATE poliklinik RESTART IDENTITY CASCADE"); err != nil {
		return 0, 0, 0, fmt.Errorf("truncate poliklinik: %w", err)
	}

	f, err := os.Open(csvPath)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("open csv: %w", err)
	}
	defer f.Close()

	rows, err := csv.NewReader(f).ReadAll()
	if err != nil {
		return 0, 0, 0, fmt.Errorf("read csv: %w", err)
	}

	poliIDs := make(map[string]int) // cache nama poliklinik -> id

	for i, row := range rows {
		if i == 0 {
			continue // header
		}
		if len(row) < 3+dayColumns {
			log.Printf("skip baris %d: jumlah kolom kurang", i+1)
			continue
		}

		clinic := clean(row[1])
		doctorName := clean(row[2])
		if clinic == "" || doctorName == "" {
			log.Printf("skip baris %d: nama atau klinik kosong", i+1)
			continue
		}

		// specialty adalah salinan nama poli (denormalized) yang tetap sinkron dengan
		// master data poliklinik.
		specialty := strings.TrimPrefix(clinic, "Klinik ")

		poliID, ok := poliIDs[specialty]
		if !ok {
			err := db.QueryRow(
				`INSERT INTO poliklinik (name) VALUES ($1)
				 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
				 RETURNING id`,
				specialty,
			).Scan(&poliID)
			if err != nil {
				return 0, 0, 0, fmt.Errorf("insert poliklinik %q: %w", specialty, err)
			}
			poliIDs[specialty] = poliID
			poliCount++
		}

		var doctorID int
		err := db.QueryRow(
			`INSERT INTO doctors (name, specialty, poli_id, license_number, email, phone_number, bio, status)
			 VALUES ($1, $2, $3, NULL, '', '', '', 'active') RETURNING id`,
			doctorName, specialty, poliID,
		).Scan(&doctorID)
		if err != nil {
			return 0, 0, 0, fmt.Errorf("insert doctor %q: %w", doctorName, err)
		}
		doctorCount++

		for j := 0; j < dayColumns; j++ {
			start, end, ok := parseScheduleCell(row[3+j])
			if !ok {
				continue
			}
			var endArg interface{}
			if end != "" {
				endArg = end
			}
			if _, err := db.Exec(
				`INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, quota)
				 VALUES ($1, $2, $3, $4, 20)`,
				doctorID, days[j], start, endArg,
			); err != nil {
				return 0, 0, 0, fmt.Errorf("insert schedule for %q: %w", doctorName, err)
			}
			scheduleCount++
		}
	}

	return poliCount, doctorCount, scheduleCount, nil
}

// seedMcuPackages men-insert/update mcu_packages + items tanpa menghapus baris lama.
func seedMcuPackages(db *sqlx.DB) error {
	for _, s := range mcuServices {
		id, err := upsertService(db, "mcu_packages", "name", s.name, s.description, s.price)
		if err != nil {
			return fmt.Errorf("upsert %q: %w", s.name, err)
		}
		if err := replaceItems(db, "mcu_package_items", "package_id", id, s.items); err != nil {
			return fmt.Errorf("items for %q: %w", s.name, err)
		}
	}
	return nil
}

// seedDiagnosticServices men-insert/update diagnostic_services + items tanpa menghapus baris lama.
func seedDiagnosticServices(db *sqlx.DB) error {
	for _, s := range diagnosticServices {
		id, err := upsertDiagnostic(db, s.category, s.name, s.description, s.price)
		if err != nil {
			return fmt.Errorf("upsert %q: %w", s.name, err)
		}
		if err := replaceItems(db, "diagnostic_service_items", "service_id", id, s.items); err != nil {
			return fmt.Errorf("items for %q: %w", s.name, err)
		}
	}
	return nil
}

func upsertService(db *sqlx.DB, table, nameCol, name, description string, price int64) (int, error) {
	var id int
	err := db.Get(&id, `SELECT id FROM `+table+` WHERE name = $1 LIMIT 1`, name)
	if err == nil {
		_, err = db.Exec(
			`UPDATE `+table+` SET description = $1, price = $2, is_active = TRUE, updated_at = NOW() WHERE id = $3`,
			description, price, id,
		)
		return id, err
	}
	err = db.Get(&id,
		`INSERT INTO `+table+` (name, description, price, is_active) VALUES ($1, $2, $3, TRUE) RETURNING id`,
		name, description, price,
	)
	return id, err
}

func upsertDiagnostic(db *sqlx.DB, category, name, description string, price int64) (int, error) {
	var id int
	err := db.Get(&id,
		`SELECT id FROM diagnostic_services WHERE category = $1 AND name = $2 LIMIT 1`, category, name)
	if err == nil {
		_, err = db.Exec(
			`UPDATE diagnostic_services SET description = $1, price = $2, is_active = TRUE, updated_at = NOW() WHERE id = $3`,
			description, price, id,
		)
		return id, err
	}
	err = db.Get(&id,
		`INSERT INTO diagnostic_services (category, name, description, price, is_active)
		 VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
		category, name, description, price,
	)
	return id, err
}

// replaceItems menghapus item lama lalu men-insert ulang sesuai urutan.
func replaceItems(db *sqlx.DB, itemsTable, fkCol string, parentID int, names []string) error {
	if _, err := db.Exec(`DELETE FROM `+itemsTable+` WHERE `+fkCol+` = $1`, parentID); err != nil {
		return err
	}
	for i, name := range names {
		if _, err := db.Exec(
			`INSERT INTO `+itemsTable+` (`+fkCol+`, name, description, position) VALUES ($1, $2, '', $3)`,
			parentID, name, i,
		); err != nil {
			return err
		}
	}
	return nil
}

// clean menormalkan whitespace (termasuk non-breaking space) menjadi spasi tunggal.
func clean(s string) string {
	return strings.Join(strings.Fields(s), " ")
}

// parseScheduleCell mengurai sel hari, mis. "08.00 - Selesai" / "09.00 - 14.00".
// Return (start, end, ok); end kosong berarti "Selesai" (buka sampai selesai).
func parseScheduleCell(cell string) (start, end string, ok bool) {
	s := clean(cell)
	if s == "" || s == "-" || strings.EqualFold(s, "Bergantian") {
		return "", "", false
	}
	s = strings.ReplaceAll(s, "..", ".")

	parts := strings.SplitN(s, "-", 2)
	if len(parts) == 0 {
		return "", "", false
	}

	start = normalizeTime(parts[0])
	if start == "" {
		return "", "", false
	}

	if len(parts) == 2 {
		endPart := strings.TrimSpace(parts[1])
		if endPart != "" && !strings.EqualFold(endPart, "Selesai") {
			end = normalizeTime(endPart)
		}
	}

	return start, end, true
}

// normalizeTime mengubah "08.00" menjadi "08:00".
func normalizeTime(s string) string {
	return strings.TrimSpace(strings.ReplaceAll(s, ".", ":"))
}
