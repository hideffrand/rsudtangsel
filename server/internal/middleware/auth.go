package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/hideffrand/rsudtangsel/server/internal/utils"
)

// contextKey is a private type used for context keys to avoid collisions with other packages.
type contextKey string

const (
	contextKeyUserID   contextKey = "user_id"
	contextKeyUserRole contextKey = "user_role"
)

// Claims defines the JWT token payload.
type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates the JWT token from the Authorization: Bearer <token> header.
// On success, it injects user_id and role into the request context.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Authorization header is required")
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid Authorization format. Use: Bearer <token>")
			return
		}

		tokenString := parts[1]
		claims, err := parseJWT(tokenString)
		if err != nil {
			utils.ErrorResponse(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Inject user_id and role into context
		ctx := context.WithValue(r.Context(), contextKeyUserID, claims.UserID)
		ctx = context.WithValue(ctx, contextKeyUserRole, claims.Role)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RoleMiddleware ensures the authenticated user has one of the allowed roles.
// Must be applied after AuthMiddleware.
func RoleMiddleware(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetUserRole(r.Context())
			if role == "" {
				utils.ErrorResponse(w, http.StatusUnauthorized, "Not authenticated")
				return
			}

			for _, allowed := range allowedRoles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			utils.ErrorResponse(w, http.StatusForbidden, "Access denied: insufficient role")
		})
	}
}

// GetUserID extracts the user ID from the context (set by AuthMiddleware).
// Returns 0 if not present.
func GetUserID(ctx context.Context) int {
	v, _ := ctx.Value(contextKeyUserID).(int)
	return v
}

// GetUserRole extracts the user role from the context (set by AuthMiddleware).
func GetUserRole(ctx context.Context) string {
	v, _ := ctx.Value(contextKeyUserRole).(string)
	return v
}

// parseJWT validates and parses a JWT token string.
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
