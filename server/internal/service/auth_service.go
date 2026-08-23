package service

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/hideffrand/rsudtangsel/server/internal/dto/response"
	"github.com/hideffrand/rsudtangsel/server/internal/middleware"
	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/hideffrand/rsudtangsel/server/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles all authentication business logic.
type AuthService struct {
	userRepo *repository.UserRepository
}

// NewAuthService creates a new AuthService instance.
func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// Login validates credentials and returns JWT tokens on success.
func (s *AuthService) Login(username, password, ip, userAgent string) (*response.LoginResponse, error) {
	// 1. Look up the user by username
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// 2. Verify password with bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		// Log failed login attempt asynchronously
		s.logAuditAsync(&model.AuditLog{
			Action:    "LOGIN_FAILED",
			IPAddress: ip,
			UserAgent: userAgent,
			Details:   fmt.Sprintf(`{"username":"%s","reason":"invalid_password"}`, username),
		})
		return nil, fmt.Errorf("invalid credentials")
	}

	// 3. Check that the account is active
	if !user.IsActive {
		return nil, fmt.Errorf("account is inactive, please contact an administrator")
	}

	// 4. Generate JWT access token
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	// 5. Generate a secure refresh token (random hex string)
	refreshToken, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	// 6. Persist the refresh token
	refreshExpiry := time.Now().Add(RefreshTokenExpiry())
	if err := s.userRepo.SaveRefreshToken(user.ID, refreshToken, refreshExpiry); err != nil {
		return nil, fmt.Errorf("save refresh token: %w", err)
	}

	// 7. Update last-login metadata: timestamp, IP, and browser (non-blocking)
	go s.userRepo.UpdateLastLogin(user.ID, ip, userAgent)

	// 8. Log successful login (non-blocking)
	s.logAuditAsync(&model.AuditLog{
		Action:    "LOGIN_SUCCESS",
		IPAddress: ip,
		UserAgent: userAgent,
		Details:   fmt.Sprintf(`{"username":"%s","role":"%s"}`, user.Username, user.Role),
	})

	accessExpirySecs := AccessTokenExpirySecs()
	return &response.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    accessExpirySecs,
		User: response.UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
		},
	}, nil
}

// RefreshToken validates a refresh token and returns a new token pair (rotation).
func (s *AuthService) RefreshToken(refreshToken string) (*response.LoginResponse, error) {
	// 1. Find and validate the refresh token in the database
	rt, err := s.userRepo.FindRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("validate refresh token: %w", err)
	}
	if rt == nil {
		return nil, fmt.Errorf("refresh token is invalid or has expired")
	}

	// 2. Double-check expiry
	if time.Now().After(rt.ExpiresAt) {
		_ = s.userRepo.DeleteRefreshToken(refreshToken)
		return nil, fmt.Errorf("refresh token has expired, please log in again")
	}

	// 3. Load the user
	user, err := s.userRepo.FindByID(rt.UserID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user not found")
	}
	if !user.IsActive {
		return nil, fmt.Errorf("account is inactive")
	}

	// 4. Rotation: delete the old refresh token
	if err := s.userRepo.DeleteRefreshToken(refreshToken); err != nil {
		return nil, fmt.Errorf("delete old refresh token: %w", err)
	}

	// 5. Generate a new access token
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	// 6. Generate a new refresh token
	newRefreshToken, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("generate new refresh token: %w", err)
	}

	// 7. Persist the new refresh token
	refreshExpiry := time.Now().Add(RefreshTokenExpiry())
	if err := s.userRepo.SaveRefreshToken(user.ID, newRefreshToken, refreshExpiry); err != nil {
		return nil, fmt.Errorf("save new refresh token: %w", err)
	}

	accessExpirySecs := AccessTokenExpirySecs()
	return &response.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    accessExpirySecs,
		User: response.UserResponse{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
		},
	}, nil
}

// GetProfile returns the public profile of the given user ID (no password).
// Used by GET /api/admin/me.
func (s *AuthService) GetProfile(userID int) (*response.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user not found")
	}
	return &response.UserResponse{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		Role:     user.Role,
	}, nil
}

// Logout deletes the refresh token from the database.
func (s *AuthService) Logout(refreshToken string) error {
	if err := s.userRepo.DeleteRefreshToken(refreshToken); err != nil {
		return fmt.Errorf("logout: %w", err)
	}
	return nil
}

// --- Private helpers ---

// generateAccessToken creates a signed JWT access token with the user's claims.
func (s *AuthService) generateAccessToken(user *model.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "changeme-please-set-JWT_SECRET-in-env"
	}

	expiry := time.Duration(AccessTokenExpirySecs()) * time.Second

	claims := &middleware.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "rsudtangsel",
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// generateSecureToken produces a cryptographically random 32-byte hex string (64 chars).
func generateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// AccessTokenExpirySecs reads ACCESS_TOKEN_EXPIRY from env (default: 3600 seconds).
func AccessTokenExpirySecs() int {
	raw := os.Getenv("ACCESS_TOKEN_EXPIRY")
	if raw == "" {
		return 3600
	}
	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		return 3600
	}
	return v
}

// RefreshTokenExpiry reads REFRESH_TOKEN_EXPIRY from env (default: 7 days).
func RefreshTokenExpiry() time.Duration {
	raw := os.Getenv("REFRESH_TOKEN_EXPIRY")
	if raw == "" {
		return 7 * 24 * time.Hour
	}
	secs, err := strconv.Atoi(raw)
	if err != nil || secs <= 0 {
		return 7 * 24 * time.Hour
	}
	return time.Duration(secs) * time.Second
}

// logAuditAsync writes an audit log entry asynchronously (non-blocking).
func (s *AuthService) logAuditAsync(log *model.AuditLog) {
	go func() {
		_ = s.userRepo.CreateAuditLog(log)
	}()
}
