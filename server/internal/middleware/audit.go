package middleware

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
)

// AuditMiddleware logs all admin requests to the audit_logs table.
// The database write runs asynchronously in a goroutine to avoid adding latency to the response.
func AuditMiddleware(userRepo *repository.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Process the request first
			next.ServeHTTP(w, r)

			// Write the audit log asynchronously
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

				// Only set user_id if the user is authenticated (> 0)
				if userID > 0 {
					auditLog.UserID = &userID
				}

				if err := userRepo.CreateAuditLog(auditLog); err != nil {
					// Log the error but do not fail the request
					log.Printf("[AUDIT] failed to save audit log: %v", err)
				}
			}()
		})
	}
}
