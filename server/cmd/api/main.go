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
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
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

	// Seed the default admin account from environment variables (idempotent)
	seedAdminUser(db)

	// Initialize layers: repository → service → handler
	// =========================================================

	// --- Public endpoints (from teammate) ---
	patientRepo := repository.NewPatientRepository(db)
	doctorRepo := repository.NewDoctorRepository(db)
	appointmentRepo := repository.NewAppointmentRepository(db)
	scheduleRepo := repository.NewDoctorScheduleRepository(db)
	poliRepo := repository.NewPoliklinikRepository(db)

	poliSvc := service.NewPoliklinikService(poliRepo)
	queueSvc := service.NewQueueService(patientRepo, doctorRepo, appointmentRepo)
	doctorSvc := service.NewDoctorService(doctorRepo, scheduleRepo, poliSvc)
	mcuPackageRepo := repository.NewMcuPackageRepository(db)
	mcuPackageSvc := service.NewMcuPackageService(mcuPackageRepo)
	diagnosticRepo := repository.NewDiagnosticServiceRepository(db)
	diagnosticSvc := service.NewDiagnosticServiceService(diagnosticRepo)

	// MCU booking layer
	mcuBookingRepo := repository.NewMcuBookingRepository(db)
	mcuBookingSvc := service.NewMcuBookingService(mcuBookingRepo, mcuPackageRepo, patientRepo)

	registrationHandler := handler.NewRegistrationHandler(queueSvc)
	queueHandler := handler.NewQueueHandler(queueSvc)
	doctorHandler := handler.NewDoctorHandler(doctorSvc)
	scheduleHandler := handler.NewScheduleHandler(doctorSvc)
	poliHandler := handler.NewPoliklinikHandler(poliSvc)
	mcuPackageHandler := handler.NewMcuPackageHandler(mcuPackageSvc)
	diagnosticHandler := handler.NewDiagnosticServiceHandler(diagnosticSvc)
	mcuBookingHandler := handler.NewMcuBookingHandler(mcuBookingSvc)

	// --- Admin endpoints (auth, dashboard, queue management) ---
	userRepo := repository.NewUserRepository(db)
	authSvc := service.NewAuthService(userRepo)
	dashboardSvc := service.NewDashboardService(appointmentRepo)
	adminHandler := handler.NewAdminHandler(authSvc, dashboardSvc, appointmentRepo)

	// --- OCR proxy (forwards uploads to the Python OCR microservice) ---
	ocrSvc := service.NewOCRService()
	ocrHandler := handler.NewOCRHandler(ocrSvc)

	// =========================================================
	// Route registration
	// =========================================================
	mux := http.NewServeMux()

	// --- Public routes (from teammate) ---
	mux.HandleFunc("/api/online-registration", registrationHandler.Handle)
	mux.HandleFunc("/api/queue", queueHandler.Handle)
	mux.HandleFunc("/api/doctors", doctorHandler.Collection)
	mux.HandleFunc("/api/doctors/{id}", doctorHandler.Item)
	mux.HandleFunc("/api/doctors/{id}/schedules", doctorHandler.DoctorSchedules)
	mux.HandleFunc("/api/schedules", scheduleHandler.Collection)
	mux.HandleFunc("/api/schedules/{id}", scheduleHandler.Item)
	mux.HandleFunc("/api/poli", poliHandler.Collection)
	mux.HandleFunc("/api/poli/{id}", poliHandler.Item)
	mux.HandleFunc("/api/mcu-packages", mcuPackageHandler.Collection)
	mux.HandleFunc("/api/mcu-packages/{id}", mcuPackageHandler.Item)
	mux.HandleFunc("/api/diagnostic-services", diagnosticHandler.Collection)
	mux.HandleFunc("/api/diagnostic-services/{id}", diagnosticHandler.Item)

	// --- Public OCR proxy route ---
	mux.HandleFunc("/api/ocr/extract", ocrHandler.Extract)

	// --- MCU booking public routes ---
	mux.HandleFunc("/api/mcu/register", mcuBookingHandler.Register)
	mux.HandleFunc("/api/mcu/my-bookings", mcuBookingHandler.GetMyBookings)

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
	adminProtected := buildAdminProtectedRouter(adminHandler, mcuBookingHandler, ocrHandler, userRepo)
	mux.Handle("/api/admin/", adminProtected)

	// --- Apply CORS middleware, then request logger to all routes ---
	rootHandler := middleware.RequestLoggerMiddleware(middleware.CORSMiddleware(mux))

	// =========================================================
	// Start the server
	// =========================================================
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAddr := ":" + port

	fmt.Printf("Server running on http://localhost%s\n", serverAddr)
	log.Fatal(http.ListenAndServe(serverAddr, rootHandler))
}

// buildAdminProtectedRouter constructs a sub-router for protected admin endpoints.
// Middleware chain: AuthMiddleware → RoleMiddleware → AuditMiddleware → handler
func buildAdminProtectedRouter(
	adminHandler *handler.AdminHandler,
	mcuBookingHandler *handler.McuBookingHandler,
	ocrHandler *handler.OCRHandler,
	userRepo *repository.UserRepository,
) http.Handler {
	protectedMux := http.NewServeMux()

	// --- Queue management ---
	protectedMux.HandleFunc("/api/admin/logout", adminHandler.Logout)
	protectedMux.HandleFunc("/api/admin/dashboard/stats", adminHandler.DashboardStats)
	protectedMux.HandleFunc("/api/admin/queue", adminHandler.AdminQueue)

	// Dynamic sub-path handler: /api/admin/queue/{id}/call or /skip
	protectedMux.HandleFunc("/api/admin/queue/", func(w http.ResponseWriter, r *http.Request) {
		trimmed := strings.TrimPrefix(r.URL.Path, "/api/admin/queue/")
		if trimmed == "" {
			adminHandler.AdminQueue(w, r)
			return
		}
		adminHandler.UpdateQueueStatus(w, r)
	})

	// --- MCU booking management ---
	protectedMux.HandleFunc("/api/admin/mcu/bookings", mcuBookingHandler.AdminListBookings)
	protectedMux.HandleFunc("/api/admin/mcu/bookings/{id}", mcuBookingHandler.AdminGetBooking)
	protectedMux.HandleFunc("/api/admin/mcu/bookings/{id}/update", mcuBookingHandler.AdminUpdateBooking)
	protectedMux.HandleFunc("/api/admin/mcu/bookings/{id}/confirm", mcuBookingHandler.AdminConfirmBooking)
	protectedMux.HandleFunc("/api/admin/mcu/bookings/{id}/cancel", mcuBookingHandler.AdminCancelBooking)
	protectedMux.HandleFunc("/api/admin/mcu/bookings/{id}/payment/confirm", mcuBookingHandler.AdminConfirmPayment)

	// --- OCR proxy (authenticated variant) ---
	protectedMux.HandleFunc("/api/admin/ocr/extract", ocrHandler.Extract)

	// Apply middleware stack: Auth → Role(admin, staff) → Audit
	return middleware.AuthMiddleware(
		middleware.RoleMiddleware("admin", "staff")(
			middleware.AuditMiddleware(userRepo)(protectedMux),
		),
	)
}

// seedAdminUser creates the default admin account on first startup.
// Credentials are read from ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD environment variables.
// The operation is idempotent — it does nothing if the username already exists.
func seedAdminUser(db *sqlx.DB) {
	username := os.Getenv("ADMIN_USERNAME")
	email := os.Getenv("ADMIN_EMAIL")
	password := os.Getenv("ADMIN_PASSWORD")

	// Skip seeding if credentials are not configured
	if username == "" || password == "" {
		log.Println("⚠️  ADMIN_USERNAME or ADMIN_PASSWORD not set — skipping admin seed")
		return
	}
	if email == "" {
		email = username + "@rsutangsel.go.id"
	}

	// Hash the password with bcrypt
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		log.Printf("❌ seedAdminUser: failed to hash password: %v", err)
		return
	}

	// Insert admin user — ON CONFLICT DO NOTHING makes this idempotent
	query := `INSERT INTO users (username, email, password_hash, role)
	           VALUES ($1, $2, $3, 'admin')
	           ON CONFLICT (username) DO NOTHING`
	result, err := db.Exec(query, username, email, string(hash))
	if err != nil {
		log.Printf("❌ seedAdminUser: failed to insert admin user: %v", err)
		return
	}

	rows, _ := result.RowsAffected()
	if rows > 0 {
		fmt.Printf(" Admin user '%s' seeded successfully\n", username)
	} else {
		fmt.Printf(" Admin user '%s' already exists — skipping seed\n", username)
	}
}
