package repository

import (
	"fmt"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// UserRepository mengelola operasi database untuk tabel users, refresh_tokens, dan audit_logs.
type UserRepository struct {
	db *sqlx.DB
}

// NewUserRepository membuat instance UserRepository baru.
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

// FindByUsername mengambil user berdasarkan username.
func (r *UserRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	query := `SELECT id, username, email, password_hash, role, is_active, last_login,
	                 created_at, updated_at
	           FROM users WHERE username = $1`
	err := r.db.Get(&user, query, username)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil // user tidak ditemukan
		}
		return nil, fmt.Errorf("find user by username: %w", err)
	}
	return &user, nil
}

// FindByID mengambil user berdasarkan ID.
func (r *UserRepository) FindByID(id int) (*model.User, error) {
	var user model.User
	query := `SELECT id, username, email, password_hash, role, is_active, last_login,
	                 created_at, updated_at
	           FROM users WHERE id = $1`
	err := r.db.Get(&user, query, id)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("find user by id: %w", err)
	}
	return &user, nil
}

// UpdateLastLogin memperbarui waktu login terakhir untuk user.
func (r *UserRepository) UpdateLastLogin(userID int) error {
	query := `UPDATE users SET last_login = $1 WHERE id = $2`
	_, err := r.db.Exec(query, time.Now().UTC(), userID)
	if err != nil {
		return fmt.Errorf("update last login: %w", err)
	}
	return nil
}

// SaveRefreshToken menyimpan refresh token baru ke database.
func (r *UserRepository) SaveRefreshToken(userID int, token string, expiresAt time.Time) error {
	query := `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`
	_, err := r.db.Exec(query, userID, token, expiresAt)
	if err != nil {
		return fmt.Errorf("save refresh token: %w", err)
	}
	return nil
}

// FindRefreshToken mencari refresh token yang valid (belum kadaluarsa) berdasarkan token string.
func (r *UserRepository) FindRefreshToken(token string) (*model.RefreshToken, error) {
	var rt model.RefreshToken
	query := `SELECT id, user_id, token, expires_at, created_at
	           FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`
	err := r.db.Get(&rt, query, token)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil // tidak ditemukan atau sudah kadaluarsa
		}
		return nil, fmt.Errorf("find refresh token: %w", err)
	}
	return &rt, nil
}

// DeleteRefreshToken menghapus refresh token dari database (logout / rotasi token).
func (r *UserRepository) DeleteRefreshToken(token string) error {
	query := `DELETE FROM refresh_tokens WHERE token = $1`
	_, err := r.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}
	return nil
}

// DeleteExpiredRefreshTokens menghapus semua refresh token yang sudah kadaluarsa.
// Bisa dipanggil secara periodik untuk membersihkan database.
func (r *UserRepository) DeleteExpiredRefreshTokens() error {
	query := `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
	_, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("delete expired refresh tokens: %w", err)
	}
	return nil
}

// CreateAuditLog menyimpan audit log ke database.
func (r *UserRepository) CreateAuditLog(log *model.AuditLog) error {
	query := `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details)
	           VALUES ($1, $2, $3, $4, $5::jsonb)`
	_, err := r.db.Exec(query, log.UserID, log.Action, log.IPAddress, log.UserAgent, log.Details)
	if err != nil {
		return fmt.Errorf("create audit log: %w", err)
	}
	return nil
}
