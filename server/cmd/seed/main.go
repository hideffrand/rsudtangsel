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

// Seeder mengimpor jadwal dokter dari CSV ke tabel doctors dan doctor_schedules.
// Cara pakai: cd server && make seed (atau go run ./cmd/seed)
// CSV diambil dari SCHEDULE_CSV env (default: ../jadwal dokter rsudtangsel.csv).
// PERHATIAN: TRUNCATE doctors CASCADE — menghapus isi doctors, doctor_schedules, dan appointments.

const dayColumns = 6 // SENIN..SABTU

var days = []string{"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	csvPath := os.Getenv("SCHEDULE_CSV")
	if csvPath == "" {
		csvPath = "../jadwal dokter rsudtangsel.csv"
	}

	db, err := database.Connect(databaseURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec("TRUNCATE doctors RESTART IDENTITY CASCADE"); err != nil {
		log.Fatalf("truncate doctors: %v", err)
	}

	f, err := os.Open(csvPath)
	if err != nil {
		log.Fatalf("open csv: %v", err)
	}
	defer f.Close()

	rows, err := csv.NewReader(f).ReadAll()
	if err != nil {
		log.Fatalf("read csv: %v", err)
	}

	doctorCount := 0
	scheduleCount := 0

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

		specialty := strings.TrimPrefix(clinic, "Klinik ")

		var doctorID int
		err := db.QueryRow(
			`INSERT INTO doctors (name, specialty, license_number, email, phone_number, bio, status)
			 VALUES ($1, $2, NULL, '', '', '', 'active') RETURNING id`,
			doctorName, specialty,
		).Scan(&doctorID)
		if err != nil {
			log.Fatalf("insert doctor %q: %v", doctorName, err)
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
				log.Fatalf("insert schedule for %q: %v", doctorName, err)
			}
			scheduleCount++
		}
	}

	// Seed MCU packages (master data from the web layanan-kesehatan page)
	if err := seedMcuPackages(db); err != nil {
		log.Fatalf("seed mcu packages: %v", err)
	}

	fmt.Printf("Seeder selesai: %d dokter, %d jadwal, %d paket MCU.\n", doctorCount, scheduleCount, len(mcuPackageSeed))
}

// mcuPackageSeed adalah master data paket MCU (dari halaman layanan-kesehatan web).
var mcuPackageSeed = []struct {
	name        string
	description string
	price       int64
	items       []string
}{
	{"MCU Hemat", "Pemeriksaan kesehatan dasar hemat & efisien (Darah Rutin, Urin Rutin, Fisik Dokter Umum).", 250000,
		[]string{"Pemeriksaan Fisik Dokter Umum", "Hematologi Rutin (Hb, Leukosit, Trombosit)", "Urine Lengkap"}},
	{"MCU Pelajar", "Khusus untuk syarat pendaftaran sekolah, kuliah, atau bebas narkoba.", 300000,
		[]string{"Fisik & Visus Mata", "Tes Bebas Narkoba 5 Parameter", "Surat Keterangan Sehat Pelajar"}},
	{"MCU Pegawai", "Persyaratan tes kesehatan CPNS, BUMN, dan karyawan perusahaan.", 450000,
		[]string{"Rontgen Thorax Digital", "Tes Bebas Narkoba 6 Parameter", "EKG Jantung Dasar", "Fisik Dokter"}},
	{"MCU Calon Pengantin", "Pemeriksaan pranikah (Premarital Check Up) untuk pasangan calon pengantin.", 650000,
		[]string{"Golongan Darah & Rhesus", "Skrining Golongan Darah & Thalassemia", "HBsAg & HIV", "Skrining Kebidanan/Urologi"}},
	{"MCU ROHAJJ (Haji/Umroh)", "Pemeriksaan kesehatan lengkap dan vaksinasi istitha'ah untuk calon jemaah Haji dan Umroh.", 750000,
		[]string{"Rontgen Dada & EKG Jantung", "Laboratorium Lengkap & Tes Kehamilan", "Vaksin Meningitis & Influenza"}},
	{"MCU Silver", "Paket skrining organ penting bagi dewasa muda.", 850000,
		[]string{"Laboratorium Darah & Urine Lengkap", "Fungsi Hati & Ginjal (Ureum, Kreatinin)", "Profil Kolesterol & Gula Darah", "Rontgen Dada"}},
	{"MCU Gold", "Skrining kesehatan eksekutif menengah.", 1350000,
		[]string{"Seluruh Fasilitas MCU Silver", "USG Abdomen / Perut", "Treadmill Test Jantung", "Konsultasi Dokter Spesialis Penyakit Dalam"}},
	{"MCU Platinum", "Skrining komprehensif organ dalam & tumor marker.", 2100000,
		[]string{"Seluruh Fasilitas MCU Gold", "Tumor Marker (CEA & AFP)", "CT-Scan Thorax / USG Mammografi", "Pemeriksaan Mata & THT"}},
	{"MCU Titanium", "Paket kualitatif terlengkap VVIP RSU Tangsel Care.", 3500000,
		[]string{"Seluruh Fasilitas MCU Platinum", "MRI 1.5 Tesla organ pilihan", "Ekokardiografi Jantung", "Kamar Rawat Transit VVIP 1 Hari"}},
	{"MCU Jantung", "Skrining khusus kebugaran & potensi serangan jantung.", 1200000,
		[]string{"EKG Jantung 12 Lead", "Treadmill Stress Test", "Ekokardiografi USG Jantung", "Profil Lipid Lengkap & Konsultasi Spesialis Jantung"}},
}

// seedMcuPackages truncates mcu_packages and inserts the master MCU package data.
func seedMcuPackages(db *sqlx.DB) error {
	if _, err := db.Exec("TRUNCATE mcu_packages RESTART IDENTITY CASCADE"); err != nil {
		return fmt.Errorf("truncate mcu packages: %w", err)
	}
	for _, p := range mcuPackageSeed {
		var packageID int
		err := db.QueryRow(
			`INSERT INTO mcu_packages (name, description, price, is_active)
			 VALUES ($1, $2, $3, TRUE) RETURNING id`,
			p.name, p.description, p.price,
		).Scan(&packageID)
		if err != nil {
			return fmt.Errorf("insert mcu package %q: %w", p.name, err)
		}
		for i, item := range p.items {
			if _, err := db.Exec(
				`INSERT INTO mcu_package_items (package_id, name, description, position)
				 VALUES ($1, $2, '', $3)`,
				packageID, item, i,
			); err != nil {
				return fmt.Errorf("insert mcu package item for %q: %w", p.name, err)
			}
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
