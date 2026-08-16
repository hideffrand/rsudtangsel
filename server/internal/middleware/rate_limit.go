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

// ipBucket holds sliding window request timestamps for a single IP address.
type ipBucket struct {
	mu         sync.Mutex
	timestamps []time.Time
}

// rateLimiter stores per-IP buckets and rate limit configuration.
type rateLimiter struct {
	mu      sync.RWMutex
	buckets map[string]*ipBucket
	limit   int
	window  time.Duration
}

// newRateLimiter creates a new rateLimiter with the given request limit per window duration.
func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	rl := &rateLimiter{
		buckets: make(map[string]*ipBucket),
		limit:   limit,
		window:  window,
	}
	// Background goroutine to clean up stale buckets every 5 minutes
	go rl.cleanup()
	return rl
}

// allow checks whether the given IP is within the rate limit using a sliding window counter.
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

	// Remove timestamps outside the current window
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

// cleanup removes buckets for IPs that have been inactive for longer than one window.
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

// RateLimitMiddleware limits the number of requests per IP per minute.
// The limit is configured via the RATE_LIMIT_PER_MINUTE environment variable (default: 100).
func RateLimitMiddleware(next http.Handler) http.Handler {
	limit := getRateLimit()
	rl := newRateLimiter(limit, time.Minute)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getClientIP(r)
		if !rl.allow(ip) {
			w.Header().Set("Retry-After", "60")
			utils.ErrorResponse(w, http.StatusTooManyRequests,
				"Too many requests. Please try again in 1 minute.")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// getRateLimit reads RATE_LIMIT_PER_MINUTE from env, defaulting to 100.
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

// getClientIP extracts the real client IP address from the request.
// Supports X-Forwarded-For and X-Real-IP headers for deployments behind a proxy or load balancer.
func getClientIP(r *http.Request) string {
	// X-Forwarded-For may contain multiple IPs: "client, proxy1, proxy2"
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		parts := strings.Split(forwarded, ",")
		if len(parts) > 0 {
			return strings.TrimSpace(parts[0])
		}
	}
	// X-Real-IP set by nginx
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}
	// Fallback to RemoteAddr (format "IP:port")
	ip := r.RemoteAddr
	if idx := strings.LastIndex(ip, ":"); idx != -1 {
		ip = ip[:idx]
	}
	return ip
}
