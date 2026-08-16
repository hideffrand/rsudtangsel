package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/hideffrand/rsudtangsel/server/internal/database"
	"github.com/hideffrand/rsudtangsel/server/internal/handler"
	"github.com/hideffrand/rsudtangsel/server/internal/middleware"
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

	// =========================================================
	// Inisialisasi layer: repository → service → handler
	// =========================================================

	// --- Public (antrian & doctor) — dari teman ---
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	scheduleRepo := repository.NewDoctorScheduleRepository(db)

	antrianSvc := service.NewAntrianService(patientRepo, doctorRepo, appointmentRepo)
	doctorSvc := service.NewDoctorService(doctorRepo, scheduleRepo)

	registrationHandler := handler.NewRegistrationHandler(antrianSvc)
	antrianHandler := handler.NewAntrianHandler(antrianSvc)
	doctorHandler := handler.NewDoctorHandler(doctorSvc)
	scheduleHandler := handler.NewScheduleHandler(doctorSvc)

	// --- Admin (auth, dashboard, antrian management) — milik kita ---
	userRepo := repository.NewUserRepository(db)
	authSvc := service.NewAuthService(userRepo)
	dashboardSvc := service.NewDashboardService(appointmentRepo)
	adminHandler := handler.NewAdminHandler(authSvc, dashboardSvc, appointmentRepo)

	// =========================================================
	// Router setup
	// =========================================================
	mux := http.NewServeMux()

	// --- Public routes (dari teman) ---
	mux.HandleFunc("/api/daftar-online", registrationHandler.Handle)
	mux.HandleFunc("/api/antrian", antrianHandler.Handle)
	mux.HandleFunc("/api/doctors", doctorHandler.Collection)
	mux.HandleFunc("/api/doctors/{id}", doctorHandler.Item)
	mux.HandleFunc("/api/doctors/{id}/schedules", doctorHandler.DoctorSchedules)
	mux.HandleFunc("/api/schedules", scheduleHandler.Collection)
	mux.HandleFunc("/api/schedules/{id}", scheduleHandler.Item)

	// --- Admin public routes (rate limited) ---
	mux.Handle("/api/admin/login",
		middleware.RateLimitMiddleware(
			http.HandlerFunc(adminHandler.Login),
		),
	)
	mux.Handle("/api/admin/refresh",
		http.HandlerFunc(adminHandler.RefreshToken),
	)

	// --- Admin protected routes (JWT + role + audit log) ---
	adminProtected := buildAdminProtectedRouter(adminHandler, userRepo)
	mux.Handle("/api/admin/", adminProtected)

	// --- Wrap semua routes dengan CORS middleware ---
	rootHandler := middleware.CORSMiddleware(mux)

	// =========================================================
	// Jalankan server
	// =========================================================
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAddr := ":" + port

	fmt.Printf("🚀 Server running on http://localhost%s\n", serverAddr)
	log.Fatal(http.ListenAndServe(serverAddr, rootHandler))
}

// buildAdminProtectedRouter membangun sub-router untuk endpoint admin yang dilindungi.
// Middleware chain: AuthMiddleware → RoleMiddleware → AuditMiddleware → handler
func buildAdminProtectedRouter(
	adminHandler *handler.AdminHandler,
	userRepo *repository.UserRepository,
) http.Handler {
	protectedMux := http.NewServeMux()

	protectedMux.HandleFunc("/api/admin/logout", adminHandler.Logout)
	protectedMux.HandleFunc("/api/admin/dashboard/stats", adminHandler.DashboardStats)
	protectedMux.HandleFunc("/api/admin/antrian", adminHandler.AdminAntrian)

	// Dynamic sub-path: /api/admin/antrian/{id}/call atau /skip
	protectedMux.HandleFunc("/api/admin/antrian/", func(w http.ResponseWriter, r *http.Request) {
		trimmed := strings.TrimPrefix(r.URL.Path, "/api/admin/antrian/")
		if trimmed == "" {
			adminHandler.AdminAntrian(w, r)
			return
		}
		adminHandler.UpdateAntrianStatus(w, r)
	})

	// Terapkan middleware: Auth → Role(admin,staff) → Audit
	return middleware.AuthMiddleware(
		middleware.RoleMiddleware("admin", "staff")(
			middleware.AuditMiddleware(userRepo)(protectedMux),
		),
	)
}
