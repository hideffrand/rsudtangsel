package middleware

import (
	"log"
	"net/http"
	"time"
)

// statusRecorder wraps http.ResponseWriter to capture the status code.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (rec *statusRecorder) WriteHeader(code int) {
	rec.status = code
	rec.ResponseWriter.WriteHeader(code)
}

// RequestLoggerMiddleware logs every incoming request: method, path,
// status code, duration, and client IP - similar to Gin's default logger.
func RequestLoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rec, r)

		log.Printf("[HTTP] %s %s -> %d %s (%s)",
			r.Method,
			r.URL.Path,
			rec.status,
			time.Since(start).Round(time.Microsecond),
			getClientIP(r),
		)
	})
}
