package middleware

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// AuditMiddleware mencatat semua request admin ke tabel audit_logs.
// Berjalan secara non-blocking (goroutine) agar tidak memperlambat response.
func AuditMiddleware(userRepo *repository.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Proses request terlebih dahulu
			next.ServeHTTP(w, r)

			// Catat audit log secara asinkron
			go func() {
				userID := GetUserID(r.Context())
				action := r.Method + " " + r.URL.Path

				// Build details JSON
				details := map[string]interface{}{
					"query":  r.URL.RawQuery,
					"method": r.Method,
					"path":   r.URL.Path,
				}
				detailsJSON, err := json.Marshal(details)
				if err != nil {
					detailsJSON = []byte("{}")
				}

				auditLog := &model.AuditLog{
					Action:    action,
					IPAddress: getClientIP(r),
					UserAgent: r.Header.Get("User-Agent"),
					Details:   string(detailsJSON),
				}

				// Hanya set user_id jika user sudah login (> 0)
				if userID > 0 {
					auditLog.UserID = &userID
				}

				if err := userRepo.CreateAuditLog(auditLog); err != nil {
					// Log error tapi jangan gagalkan request
					log.Printf("[AUDIT] gagal menyimpan audit log: %v", err)
				}
			}()
		})
	}
}
