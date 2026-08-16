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

// AuthService menangani business logic autentikasi admin.
type AuthService struct {
	userRepo *repository.UserRepository
}

// NewAuthService membuat instance AuthService baru.
func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// Login memvalidasi kredensial dan mengembalikan JWT token jika berhasil.
func (s *AuthService) Login(username, password, ip, userAgent string) (*response.LoginResponse, error) {
	// 1. Cari user berdasarkan username
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("cari user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// 2. Verifikasi password dengan bcrypt
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		// Catat audit log kegagalan login
		s.logAuditAsync(&model.AuditLog{
			Action:    "LOGIN_FAILED",
			IPAddress: ip,
			UserAgent: userAgent,
			Details:   fmt.Sprintf(`{"username":"%s","reason":"invalid_password"}`, username),
		})
		return nil, fmt.Errorf("invalid credentials")
	}

	// 3. Cek apakah user masih aktif
	if !user.IsActive {
		return nil, fmt.Errorf("akun tidak aktif, hubungi administrator")
	}

	// 4. Generate access token (JWT)
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	// 5. Generate refresh token (random hex string)
	refreshToken, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	// 6. Simpan refresh token ke database
	refreshExpiry := time.Now().Add(getRefreshTokenExpiry())
	if err := s.userRepo.SaveRefreshToken(user.ID, refreshToken, refreshExpiry); err != nil {
		return nil, fmt.Errorf("simpan refresh token: %w", err)
	}

	// 7. Update last_login
	go s.userRepo.UpdateLastLogin(user.ID)

	// 8. Catat audit log sukses
	s.logAuditAsync(&model.AuditLog{
		Action:    "LOGIN_SUCCESS",
		IPAddress: ip,
		UserAgent: userAgent,
		Details:   fmt.Sprintf(`{"username":"%s","role":"%s"}`, user.Username, user.Role),
	})

	accessExpirySecs := getAccessTokenExpirySecs()
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

// RefreshToken memvalidasi refresh token dan mengembalikan token baru (rotasi).
func (s *AuthService) RefreshToken(refreshToken string) (*response.LoginResponse, error) {
	// 1. Cari dan validasi refresh token di database
	rt, err := s.userRepo.FindRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("validasi refresh token: %w", err)
	}
	if rt == nil {
		return nil, fmt.Errorf("refresh token tidak valid atau sudah kadaluarsa")
	}

	// 2. Cek apakah token sudah expired
	if time.Now().After(rt.ExpiresAt) {
		_ = s.userRepo.DeleteRefreshToken(refreshToken)
		return nil, fmt.Errorf("refresh token sudah kadaluarsa, silakan login ulang")
	}

	// 3. Ambil data user
	user, err := s.userRepo.FindByID(rt.UserID)
	if err != nil || user == nil {
		return nil, fmt.Errorf("user tidak ditemukan")
	}
	if !user.IsActive {
		return nil, fmt.Errorf("akun tidak aktif")
	}

	// 4. Rotasi: hapus refresh token lama
	if err := s.userRepo.DeleteRefreshToken(refreshToken); err != nil {
		return nil, fmt.Errorf("hapus refresh token lama: %w", err)
	}

	// 5. Generate access token baru
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	// 6. Generate refresh token baru
	newRefreshToken, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token baru: %w", err)
	}

	// 7. Simpan refresh token baru
	refreshExpiry := time.Now().Add(getRefreshTokenExpiry())
	if err := s.userRepo.SaveRefreshToken(user.ID, newRefreshToken, refreshExpiry); err != nil {
		return nil, fmt.Errorf("simpan refresh token baru: %w", err)
	}

	accessExpirySecs := getAccessTokenExpirySecs()
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

// Logout menghapus refresh token dari database.
func (s *AuthService) Logout(refreshToken string) error {
	if err := s.userRepo.DeleteRefreshToken(refreshToken); err != nil {
		return fmt.Errorf("logout: %w", err)
	}
	return nil
}

// --- Private helpers ---

// generateAccessToken membuat JWT access token dengan claims user.
func (s *AuthService) generateAccessToken(user *model.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "changeme-please-set-JWT_SECRET-in-env"
	}

	expiry := time.Duration(getAccessTokenExpirySecs()) * time.Second

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

// generateSecureToken menghasilkan random hex string 32 byte (64 karakter).
func generateSecureToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// getAccessTokenExpirySecs membaca ACCESS_TOKEN_EXPIRY dari env (default: 3600 detik).
func getAccessTokenExpirySecs() int {
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

// getRefreshTokenExpiry membaca REFRESH_TOKEN_EXPIRY dari env (default: 7 hari).
func getRefreshTokenExpiry() time.Duration {
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

// logAuditAsync mencatat audit log secara asinkron (non-blocking).
func (s *AuthService) logAuditAsync(log *model.AuditLog) {
	go func() {
		_ = s.userRepo.CreateAuditLog(log)
	}()
}
