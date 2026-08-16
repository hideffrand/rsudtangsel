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
	// Load .env file — optional, does not fail if the file is absent in production
	_ = godotenv.Load()

	// Connect to the database
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
	// Initialize layers: repository → service → handler
	// =========================================================

	// --- Public endpoints (from teammate) ---
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

	// --- Admin endpoints (auth, dashboard, queue management) ---
	userRepo := repository.NewUserRepository(db)
	authSvc := service.NewAuthService(userRepo)
	dashboardSvc := service.NewDashboardService(appointmentRepo)
	adminHandler := handler.NewAdminHandler(authSvc, dashboardSvc, appointmentRepo)

	// =========================================================
	// Route registration
	// =========================================================
	mux := http.NewServeMux()

	// --- Public routes (from teammate) ---
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

	// --- Admin protected routes (JWT auth + role check + audit logging) ---
	adminProtected := buildAdminProtectedRouter(adminHandler, userRepo)
	mux.Handle("/api/admin/", adminProtected)

	// --- Apply CORS middleware to all routes ---
	rootHandler := middleware.CORSMiddleware(mux)

	// =========================================================
	// Start the server
	// =========================================================
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAddr := ":" + port

	fmt.Printf("🚀 Server running on http://localhost%s\n", serverAddr)
	log.Fatal(http.ListenAndServe(serverAddr, rootHandler))
}

// buildAdminProtectedRouter constructs a sub-router for protected admin endpoints.
// Middleware chain: AuthMiddleware → RoleMiddleware → AuditMiddleware → handler
func buildAdminProtectedRouter(
	adminHandler *handler.AdminHandler,
	userRepo *repository.UserRepository,
) http.Handler {
	protectedMux := http.NewServeMux()

	protectedMux.HandleFunc("/api/admin/logout", adminHandler.Logout)
	protectedMux.HandleFunc("/api/admin/dashboard/stats", adminHandler.DashboardStats)
	protectedMux.HandleFunc("/api/admin/antrian", adminHandler.AdminAntrian)

	// Dynamic sub-path handler: /api/admin/antrian/{id}/call or /skip
	protectedMux.HandleFunc("/api/admin/antrian/", func(w http.ResponseWriter, r *http.Request) {
		trimmed := strings.TrimPrefix(r.URL.Path, "/api/admin/antrian/")
		if trimmed == "" {
			adminHandler.AdminAntrian(w, r)
			return
		}
		adminHandler.UpdateAntrianStatus(w, r)
	})

	// Apply middleware stack: Auth → Role(admin, staff) → Audit
	return middleware.AuthMiddleware(
		middleware.RoleMiddleware("admin", "staff")(
			middleware.AuditMiddleware(userRepo)(protectedMux),
		),
	)
}
