package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// contextKey adalah tipe khusus untuk key context agar tidak bertabrakan dengan package lain.
type contextKey string

const (
	contextKeyUserID   contextKey = "user_id"
	contextKeyUserRole contextKey = "user_role"
)

// Claims mendefinisikan payload JWT.
type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware memvalidasi JWT token dari header Authorization: Bearer <token>.
// Token yang valid akan menyuntikkan user_id dan role ke dalam context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Authorization header wajib diisi")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Format Authorization tidak valid. Gunakan: Bearer <token>")
			return
		}

		tokenString := parts[1]
		claims, err := parseJWT(tokenString)
		if err != nil {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Token tidak valid atau sudah kadaluarsa")
			return
		}

		// Suntikkan user_id dan role ke context
		ctx := context.WithValue(r.Context(), contextKeyUserID, claims.UserID)
		ctx = context.WithValue(ctx, contextKeyUserRole, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RoleMiddleware memastikan user memiliki salah satu role yang diizinkan.
// Harus dipasang setelah AuthMiddleware.
func RoleMiddleware(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetUserRole(r.Context())
			if role == "" {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Tidak terautentikasi")
				return
			}

			for _, allowed := range allowedRoles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			utils.ErrorResponse(w, http.StatusForbidden, "Akses ditolak: role tidak memiliki izin")
		})
	}
}

// GetUserID mengambil user ID dari context (diisi oleh AuthMiddleware).
// Mengembalikan 0 jika tidak ada.
func GetUserID(ctx context.Context) int {
	v, _ := ctx.Value(contextKeyUserID).(int)
	return v
}

// GetUserRole mengambil role user dari context (diisi oleh AuthMiddleware).
func GetUserRole(ctx context.Context) string {
	v, _ := ctx.Value(contextKeyUserRole).(string)
	return v
}

// parseJWT memvalidasi dan mem-parse JWT token string.
func parseJWT(tokenString string) (*Claims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "changeme-please-set-JWT_SECRET-in-env"
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}
