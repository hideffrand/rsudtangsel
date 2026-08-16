package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/hideffrand/rsudtangsel/server/internal/database"
	"github.com/hideffrand/rsudtangsel/server/internal/handler"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
	"github.com/hideffrand/rsudtangsel/server/internal/service"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env (opsional — tidak error jika file tidak ada di production)
	_ = godotenv.Load()

	// Koneksi database
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

	// Inisialisasi layer: repository → service → handler
	pasienRepo := repository.NewPasienRepository(db)
	pendaftaranRepo := repository.NewPendaftaranRepository(db)

	antrianSvc := service.NewAntrianService(pasienRepo, pendaftaranRepo)

	daftarOnlineHandler := handler.NewDaftarOnlineHandler(antrianSvc)
	antrianHandler := handler.NewAntrianHandler(antrianSvc)

	// Register routes
	mux := http.NewServeMux()
	mux.HandleFunc("/api/daftar-online", daftarOnlineHandler.Handle)
	mux.HandleFunc("/api/antrian", antrianHandler.Handle)

	// Jalankan server
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAddr := ":" + port

	fmt.Printf("🚀 Server running on http://localhost%s\n", serverAddr)
	log.Fatal(http.ListenAndServe(serverAddr, mux))
}
