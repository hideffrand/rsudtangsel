package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/hideffrand/rsudtangsel/server/internal/database"
	"github.com/joho/godotenv"
)

// Seeder mengimpor jadwal dokter dari CSV ke tabel poliklinik, doctors, dan doctor_schedules.
// Cara pakai: cd server && make seed (atau go run ./cmd/seed)
// CSV diambil dari SCHEDULE_CSV env (default: ../jadwal dokter rsudtangsel.csv).
// PERHATIAN: TRUNCATE doctors & poliklinik CASCADE — menghapus isi doctors, doctor_schedules,
// appointments, dan poliklinik (relasi dokter-ke-poli dibangun ulang dari CSV).

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
	if _, err := db.Exec("TRUNCATE poliklinik RESTART IDENTITY CASCADE"); err != nil {
		log.Fatalf("truncate poliklinik: %v", err)
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
	poliCount := 0
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

		specialty := strings.TrimPrefix(clinic, "Klinik ")

		// Pastikan poliklinik sudah ada di master data poli.
		poliID, ok := poliIDs[specialty]
		if !ok {
			err := db.QueryRow(
				`INSERT INTO poliklinik (name) VALUES ($1)
				 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
				 RETURNING id`,
				specialty,
			).Scan(&poliID)
			if err != nil {
				log.Fatalf("insert poliklinik %q: %v", specialty, err)
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

	fmt.Printf("Seeder selesai: %d poliklinik, %d dokter, %d jadwal.\n", poliCount, doctorCount, scheduleCount)
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
