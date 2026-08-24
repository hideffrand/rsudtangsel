package middleware

import (
	"fmt"
	"net/http"
	"time"
)

// ANSI color codes for the request logger.
const (
	colorReset  = "\033[0m"
	colorDim    = "\033[2m"
	colorBold   = "\033[1m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorBlue   = "\033[34m"
	colorCyan   = "\033[36m"
	colorWhite  = "\033[37m"
)

// statusRecorder wraps http.ResponseWriter to capture the status code
// and the number of bytes written (response bandwidth).
type statusRecorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (rec *statusRecorder) WriteHeader(code int) {
	rec.status = code
	rec.ResponseWriter.WriteHeader(code)
}

func (rec *statusRecorder) Write(b []byte) (int, error) {
	n, err := rec.ResponseWriter.Write(b)
	rec.bytes += n
	return n, err
}

// RequestLoggerMiddleware logs every incoming request: method, path,
// status code, duration, client IP and bandwidth (bytes in/out) —
// with ANSI colors similar to Gin's dev logger.
func RequestLoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		reqBytes := r.ContentLength
		if reqBytes < 0 {
			reqBytes = 0
		}
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(rec, r)

		duration := time.Since(start)
		fmt.Printf("%s%s%s %s%-7s%s %s%s%s %s %s%v%s %s↑ %s%s ↓ %s%s%s\n",
			colorDim, start.Format("15:04:05"), colorReset,
			methodColor(r.Method), r.Method, colorReset,
			statusColor(rec.status), fmt.Sprintf("%3d", rec.status), colorReset,
			formatBytes(reqBytes),
			durationColor(duration), duration.Round(time.Microsecond), colorReset,
			colorDim, formatBytes(int64(rec.bytes)), colorReset,
			colorDim, getClientIP(r), colorReset,
		)
	})
}

// methodColor returns an ANSI color per HTTP method.
func methodColor(method string) string {
	switch method {
	case http.MethodGet:
		return colorCyan
	case http.MethodPost:
		return colorGreen
	case http.MethodPut:
		return colorYellow
	case http.MethodPatch:
		return colorBlue
	case http.MethodDelete:
		return colorRed
	default:
		return colorWhite
	}
}

// statusColor returns an ANSI color by status class:
// 2xx green, 3xx blue, 4xx yellow, 5xx red.
func statusColor(status int) string {
	switch {
	case status >= 500:
		return colorRed
	case status >= 400:
		return colorYellow
	case status >= 300:
		return colorBlue
	case status >= 200:
		return colorGreen
	default:
		return colorWhite
	}
}

// durationColor highlights slow requests: <100ms green, <1s yellow, else red.
func durationColor(d time.Duration) string {
	switch {
	case d >= time.Second:
		return colorRed
	case d >= 100*time.Millisecond:
		return colorYellow
	default:
		return colorGreen
	}
}

// formatBytes renders a byte count in a human-friendly unit (B/KB/MB).
func formatBytes(n int64) string {
	const unit = 1024.0
	if n < unit {
		return fmt.Sprintf("%dB", n)
	}
	div, exp := int64(unit), 0
	for m := n / unit; m >= unit; m /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f%cB", float64(n)/float64(div), "KM"[exp])
}
