package repository

import (
	"fmt"
	"time"

	"github.com/hideffrand/rsudtangsel/server/internal/model"
	"github.com/jmoiron/sqlx"
)

// UserRepository handles all database operations for the users, refresh_tokens, and audit_logs tables.
type UserRepository struct {
	db *sqlx.DB
}

// NewUserRepository creates a new UserRepository instance.
func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

// FindByUsername retrieves a user by their username.
func (r *UserRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	query := `SELECT id, username, email, password_hash, role, is_active, last_login,
	                 last_login_ip, last_login_user_agent, created_at, updated_at
	           FROM users WHERE username = $1`
	err := r.db.Get(&user, query, username)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil // user not found
		}
		return nil, fmt.Errorf("find user by username: %w", err)
	}
	return &user, nil
}

// FindByID retrieves a user by their ID.
func (r *UserRepository) FindByID(id int) (*model.User, error) {
	var user model.User
	query := `SELECT id, username, email, password_hash, role, is_active, last_login,
	                 last_login_ip, last_login_user_agent, created_at, updated_at
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

// UpdateLastLogin records when, from where (IP), and with which browser a user last logged in.
func (r *UserRepository) UpdateLastLogin(userID int, ip, userAgent string) error {
	query := `UPDATE users SET last_login = $1, last_login_ip = $2, last_login_user_agent = $3 WHERE id = $4`
	_, err := r.db.Exec(query, time.Now().UTC(), ip, userAgent, userID)
	if err != nil {
		return fmt.Errorf("update last login: %w", err)
	}
	return nil
}

// FindAllUsers returns all users ordered by creation time (newest first).
func (r *UserRepository) FindAllUsers() ([]model.User, error) {
	var users []model.User
	query := `SELECT id, username, email, password_hash, role, is_active, last_login,
	                 last_login_ip, last_login_user_agent, created_at, updated_at
	           FROM users ORDER BY created_at DESC, id DESC`
	err := r.db.Select(&users, query)
	if err != nil {
		return nil, fmt.Errorf("find all users: %w", err)
	}
	return users, nil
}

// CreateUser inserts a new user. Returns the generated ID.
func (r *UserRepository) CreateUser(u *model.User) (int, error) {
	var id int
	query := `INSERT INTO users (username, email, password_hash, role, is_active)
	          VALUES ($1, $2, $3, $4, $5) RETURNING id`
	err := r.db.QueryRow(query, u.Username, u.Email, u.PasswordHash, u.Role, u.IsActive).Scan(&id)
	if err != nil {
		return 0, fmt.Errorf("create user: %w", err)
	}
	return id, nil
}

// UpdateUser applies partial updates to a user. Returns false if not found.
func (r *UserRepository) UpdateUser(id int, email, passwordHash, role *string, isActive *bool) (bool, error) {
	query := `UPDATE users SET updated_at = NOW()`
	args := []interface{}{}
	idx := 1

	if email != nil {
		query += fmt.Sprintf(", email = $%d", idx)
		args = append(args, *email)
		idx++
	}
	if passwordHash != nil {
		query += fmt.Sprintf(", password_hash = $%d", idx)
		args = append(args, *passwordHash)
		idx++
	}
	if role != nil {
		query += fmt.Sprintf(", role = $%d", idx)
		args = append(args, *role)
		idx++
	}
	if isActive != nil {
		query += fmt.Sprintf(", is_active = $%d", idx)
		args = append(args, *isActive)
		idx++
	}

	query += fmt.Sprintf(" WHERE id = $%d", idx)
	args = append(args, id)

	res, err := r.db.Exec(query, args...)
	if err != nil {
		return false, fmt.Errorf("update user: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// DeleteUser removes a user and their refresh tokens. Returns false if not found.
func (r *UserRepository) DeleteUser(id int) (bool, error) {
	res, err := r.db.Exec(`DELETE FROM refresh_tokens WHERE user_id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete user refresh tokens: %w", err)
	}
	_ = res
	res, err = r.db.Exec(`DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete user: %w", err)
	}
	n, _ := res.RowsAffected()
	return n > 0, nil
}

// SaveRefreshToken saves a new refresh token to the database.
func (r *UserRepository) SaveRefreshToken(userID int, token string, expiresAt time.Time) error {
	query := `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`
	_, err := r.db.Exec(query, userID, token, expiresAt)
	if err != nil {
		return fmt.Errorf("save refresh token: %w", err)
	}
	return nil
}

// FindRefreshToken looks up a valid (non-expired) refresh token.
func (r *UserRepository) FindRefreshToken(token string) (*model.RefreshToken, error) {
	var rt model.RefreshToken
	query := `SELECT id, user_id, token, expires_at, created_at
	           FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()`
	err := r.db.Get(&rt, query, token)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil // not found or already expired
		}
		return nil, fmt.Errorf("find refresh token: %w", err)
	}
	return &rt, nil
}

// DeleteRefreshToken removes a refresh token from the database (logout / rotation).
func (r *UserRepository) DeleteRefreshToken(token string) error {
	query := `DELETE FROM refresh_tokens WHERE token = $1`
	_, err := r.db.Exec(query, token)
	if err != nil {
		return fmt.Errorf("delete refresh token: %w", err)
	}
	return nil
}

// DeleteExpiredRefreshTokens removes all expired refresh tokens.
// Can be called periodically to keep the table clean.
func (r *UserRepository) DeleteExpiredRefreshTokens() error {
	query := `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
	_, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("delete expired refresh tokens: %w", err)
	}
	return nil
}

// CreateAuditLog persists an audit log entry to the database.
func (r *UserRepository) CreateAuditLog(log *model.AuditLog) error {
	query := `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details)
	           VALUES ($1, $2, $3, $4, $5::jsonb)`
	_, err := r.db.Exec(query, log.UserID, log.Action, log.IPAddress, log.UserAgent, log.Details)
	if err != nil {
		return fmt.Errorf("create audit log: %w", err)
	}
	return nil
}
