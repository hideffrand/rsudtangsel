package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/hideffrand/rsudtangsel/server/internal/database"
	"github.com/joho/godotenv"
)

// Struct untuk request daftar online
type DaftarOnlineRequest struct {
	NIK             string `json:"nik"`
	Nama            string `json:"nama"`
	TanggalLahir    string `json:"tanggal_lahir"`
	Alamat          string `json:"alamat"`
	NoHP            string `json:"no_hp"`
	Poli            string `json:"poli"`
	Dokter          string `json:"dokter"`
	Tanggal         string `json:"tanggal"`
	Jam             string `json:"jam"`
	JenisPembayaran string `json:"jenis_pembayaran"`
}

// Handler daftar online
func handleDaftarOnline(w http.ResponseWriter, r *http.Request) {
	// Hanya menerima POST
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var req DaftarOnlineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validasi dasar
	if req.NIK == "" || req.Nama == "" || req.NoHP == "" {
		http.Error(w, "NIK, Nama, dan No HP wajib diisi", http.StatusBadRequest)
		return
	}

	// TODO: Simpan ke database (nanti kita tambahkan)
	// 1. Cek pasien berdasarkan NIK
	// 2. Insert pasien jika belum ada
	// 3. Generate nomor antrian
	// 4. Insert pendaftaran

	// Response sementara
	response := map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"nomor_antrian": "A001",
			"qr_code":       "https://api.qrserver.com/v1/create-qr-code/?data=A001",
			"pesan":         "Pendaftaran berhasil! Nomor antrian Anda: A001",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// Handler cek antrian
func handleCekAntrian(w http.ResponseWriter, r *http.Request) {
	// TODO: Query antrian dari database
	antrian := []map[string]interface{}{
		{"nomor": "A001", "nama": "Budi", "status": "Selesai"},
		{"nomor": "A002", "nama": "Ani", "status": "Diproses"},
		{"nomor": "A003", "nama": "Citra", "status": "Menunggu"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    antrian,
	})
}

func main() {
	// Load .env
	godotenv.Load()

	// Database connection
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	db, err := database.Connect(databaseURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer db.Close()

	fmt.Println("✅ connected to database")

	// Register routes
	http.HandleFunc("/api/daftar-online", handleDaftarOnline)
	http.HandleFunc("/api/antrian", handleCekAntrian)

	// Jalankan server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAddr := ":" + port

	fmt.Printf("🚀 Server running on http://localhost%s\n", serverAddr)
	log.Fatal(http.ListenAndServe(serverAddr, nil))
}