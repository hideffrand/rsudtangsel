package middleware

import (
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// ipBucket menyimpan sliding window request timestamps per IP.
type ipBucket struct {
	mu         sync.Mutex
	timestamps []time.Time
}

// rateLimiter menyimpan semua IP bucket.
type rateLimiter struct {
	mu      sync.RWMutex
	buckets map[string]*ipBucket
	limit   int
	window  time.Duration
}

// newRateLimiter membuat instance rateLimiter baru.
func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		buckets: make(map[string]*ipBucket),
		limit:   limit,
		window:  window,
	}
	// Goroutine pembersih bucket lama setiap 5 menit
	go rl.cleanup()
	return rl
}

// allow memeriksa apakah IP diizinkan untuk melakukan request.
// Menggunakan sliding window counter.
func (rl *rateLimiter) allow(ip string) bool {
	rl.mu.Lock()
	bucket, exists := rl.buckets[ip]
	if !exists {
		bucket = &ipBucket{}
		rl.buckets[ip] = bucket
	}
	rl.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-rl.window)

	bucket.mu.Lock()
	defer bucket.mu.Unlock()

	// Hapus timestamp lama di luar window
	valid := bucket.timestamps[:0]
	for _, ts := range bucket.timestamps {
		if ts.After(cutoff) {
			valid = append(valid, ts)
		}
	}
	bucket.timestamps = valid

	if len(bucket.timestamps) >= rl.limit {
		return false
	}

	bucket.timestamps = append(bucket.timestamps, now)
	return true
}

// cleanup menghapus bucket IP yang sudah tidak aktif setiap 5 menit.
func (rl *rateLimiter) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		cutoff := time.Now().Add(-rl.window)
		for ip, bucket := range rl.buckets {
			bucket.mu.Lock()
			active := false
			for _, ts := range bucket.timestamps {
				if ts.After(cutoff) {
					active = true
					break
				}
			}
			bucket.mu.Unlock()
			if !active {
				delete(rl.buckets, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware membatasi jumlah request per IP per menit.
// Limit dikonfigurasi via RATE_LIMIT_PER_MINUTE di .env (default: 100).
func RateLimitMiddleware(next http.Handler) http.Handler {
	limit := getRateLimit()
	rl := newRateLimiter(limit, time.Minute)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		if !rl.allow(ip) {
			w.Header().Set("Retry-After", "60")
			utils.ErrorResponse(w, http.StatusTooManyRequests,
				"Terlalu banyak request. Coba lagi dalam 1 menit.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// getRateLimit membaca RATE_LIMIT_PER_MINUTE dari env, default 100.
func getRateLimit() int {
	raw := os.Getenv("RATE_LIMIT_PER_MINUTE")
	if raw == "" {
		return 100
	}
	limit, err := strconv.Atoi(raw)
	if err != nil || limit <= 0 {
		return 100
	}
	return limit
}

// getClientIP mengambil IP address client yang sebenarnya.
// Mendukung X-Forwarded-For dan X-Real-IP untuk deployment di balik proxy/load balancer.
func getClientIP(r *http.Request) string {
	// X-Forwarded-For bisa berisi multiple IPs: "client, proxy1, proxy2"
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	// X-Real-IP dari nginx
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}
	// Fallback ke RemoteAddr (format "IP:port")
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	return ip
}
