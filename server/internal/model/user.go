package model

import "time"

// User merepresentasikan tabel users di database.
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

// RefreshToken merepresentasikan tabel refresh_tokens di database.
type RefreshToken struct {
	ID        int       `db:"id"`
	UserID    int       `db:"user_id"`
	Token     string    `db:"token"`
	ExpiresAt time.Time `db:"expires_at"`
	CreatedAt time.Time `db:"created_at"`
}

// AuditLog merepresentasikan tabel audit_logs di database.
type AuditLog struct {
	ID        int    `db:"id"`
	UserID    *int   `db:"user_id"` // nullable (pre-login actions)
	Action    string `db:"action"`
	IPAddress string `db:"ip_address"`
	UserAgent string `db:"user_agent"`
	Details   string `db:"details"` // JSON string (JSONB in postgres)
	CreatedAt string `db:"created_at"`
}
