package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
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

	// Medical package catalog (MCU + Lab + Radiologi dalam satu tabel)
	medicalPackageRepo := repository.NewMedicalPackageRepository(db)
	medicalPackageSvc := service.NewMedicalPackageService(medicalPackageRepo)

	// MCU booking layer
	medicalPackageBookingRepo := repository.NewMedicalPackageBookingRepository(db)
	medicalPackageBookingSvc := service.NewMedicalPackageBookingService(medicalPackageBookingRepo, medicalPackageRepo, patientRepo)

	registrationHandler := handler.NewRegistrationHandler(queueSvc)
	queueHandler := handler.NewQueueHandler(queueSvc)
	doctorHandler := handler.NewDoctorHandler(doctorSvc)
	scheduleHandler := handler.NewScheduleHandler(doctorSvc)
	poliHandler := handler.NewPoliklinikHandler(poliSvc)
	medicalPackageHandler := handler.NewMedicalPackageHandler(medicalPackageSvc)
	medicalPackageBookingHandler := handler.NewMedicalPackageBookingHandler(medicalPackageBookingSvc)

	// --- Admin endpoints (auth, dashboard, queue management) ---
	userRepo := repository.NewUserRepository(db)
	authSvc := service.NewAuthService(userRepo)
	dashboardSvc := service.NewDashboardService(appointmentRepo)
	adminHandler := handler.NewAdminHandler(authSvc, dashboardSvc, appointmentRepo)

	// --- User management (CRUD akun staff) ---
	userSvc := service.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userSvc)

	// --- Document type master data (jenis dokumen OCR) ---
	ocrDocumentTypeRepo := repository.NewOCRDocumentTypeRepository(db)
	ocrDocumentTypeSvc := service.NewOCRDocumentTypeService(ocrDocumentTypeRepo)
	ocrDocumentTypeHandler := handler.NewOCRDocumentTypeHandler(ocrDocumentTypeSvc)

	// --- OCR proxy (forwards uploads to the Python OCR microservice) ---
	ocrSvc := service.NewOCRService()
	ocrHandler := handler.NewOCRHandler(ocrSvc, ocrDocumentTypeRepo)

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
	mux.HandleFunc("/api/medical-packages", medicalPackageHandler.Collection)
	mux.HandleFunc("/api/medical-packages/{id}", medicalPackageHandler.Item)

	// --- Public OCR proxy route ---
	mux.HandleFunc("/api/ocr/extract", ocrHandler.Extract)

	// --- MCU booking public routes ---
	mux.HandleFunc("/api/package-bookings/register", medicalPackageBookingHandler.Register)
	mux.HandleFunc("/api/package-bookings/my-bookings", medicalPackageBookingHandler.GetMyBookings)

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
	adminProtected := buildAdminProtectedRouter(adminHandler, medicalPackageBookingHandler, ocrHandler, ocrDocumentTypeHandler, userHandler, userRepo)
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

	c := "\033[36m"
	g := "\033[32m"
	w := "\033[37m"
	bold := "\033[1m"
	dim := "\033[2m"
	rst := "\033[0m"
	fmt.Printf(`
%s╭─────────────────────────────────────────────╮%s
%s│  🏥 RSU Tangsel API                          │%s
%s│  ➜  %shttp://localhost%s%s%s              │%s
%s│  ⏱  %s%s%s                       │%s
%s╰─────────────────────────────────────────────╯%s
`,
		c, rst,
		c, rst,
		c, bold+g, w+bold, serverAddr, rst, rst,
		c, dim, time.Now().Format("Mon, 02 Jan 2006 15:04:05"), rst, rst,
		c, rst,
	)
	log.Fatal(http.ListenAndServe(serverAddr, rootHandler))
}

// buildAdminProtectedRouter constructs a sub-router for protected admin endpoints.
// Middleware chain: AuthMiddleware → RoleMiddleware → AuditMiddleware → handler
func buildAdminProtectedRouter(
	adminHandler *handler.AdminHandler,
	medicalPackageBookingHandler *handler.MedicalPackageBookingHandler,
	ocrHandler *handler.OCRHandler,
	ocrDocumentTypeHandler *handler.OCRDocumentTypeHandler,
	userHandler *handler.UserHandler,
	userRepo *repository.UserRepository,
) http.Handler {
	protectedMux := http.NewServeMux()

	// --- Queue management ---
	protectedMux.HandleFunc("/api/admin/logout", adminHandler.Logout)
	protectedMux.HandleFunc("/api/admin/dashboard/stats", adminHandler.DashboardStats)
	protectedMux.HandleFunc("/api/admin/queue", adminHandler.AdminQueue)
	protectedMux.HandleFunc("/api/admin/me", adminHandler.Me)

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
	protectedMux.HandleFunc("/api/admin/package-bookings", medicalPackageBookingHandler.AdminListBookings)
	protectedMux.HandleFunc("/api/admin/package-bookings/{id}", medicalPackageBookingHandler.AdminGetBooking)
	protectedMux.HandleFunc("/api/admin/package-bookings/{id}/update", medicalPackageBookingHandler.AdminUpdateBooking)
	protectedMux.HandleFunc("/api/admin/package-bookings/{id}/confirm", medicalPackageBookingHandler.AdminConfirmBooking)
	protectedMux.HandleFunc("/api/admin/package-bookings/{id}/cancel", medicalPackageBookingHandler.AdminCancelBooking)

	// --- OCR proxy (authenticated variant) ---
	protectedMux.HandleFunc("/api/admin/ocr/extract", ocrHandler.Extract)

	// --- Document type master data (CRUD) ---
	protectedMux.HandleFunc("/api/admin/ocr-document-types", ocrDocumentTypeHandler.Collection)
	protectedMux.HandleFunc("/api/admin/ocr-document-types/{id}", ocrDocumentTypeHandler.Item)

	// --- User management (CRUD) ---
	protectedMux.HandleFunc("/api/admin/users", userHandler.Collection)
	protectedMux.HandleFunc("/api/admin/users/{id}", userHandler.Item)

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
