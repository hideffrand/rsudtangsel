package model

import "time"

// User represents the users table in the database.
type User struct {
	ID           int        `db:"id"`
	Username     string     `db:"username"`
	Email        string     `db:"email"`
	PasswordHash string     `db:"password_hash"`
	Role         string     `db:"role"` // admin, staff, doctor
	IsActive     bool       `db:"is_active"`
	LastLogin    *time.Time `db:"last_login"` // nullable
	CreatedAt    time.Time  `db:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"`
}

// RefreshToken represents the refresh_tokens table in the database.
type RefreshToken struct {
	ID        int       `db:"id"`
	UserID    int       `db:"user_id"`
	Token     string    `db:"token"`
	ExpiresAt time.Time `db:"expires_at"`
	CreatedAt time.Time `db:"created_at"`
}

// AuditLog represents the audit_logs table in the database.
type AuditLog struct {
	ID        int    `db:"id"`
	UserID    *int   `db:"user_id"` // nullable (pre-login actions have no user)
	Action    string `db:"action"`
	IPAddress string `db:"ip_address"`
	UserAgent string `db:"user_agent"`
	Details   string `db:"details"` // JSON string stored as JSONB in postgres
	CreatedAt string `db:"created_at"`
}
