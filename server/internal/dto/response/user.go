package response

// AdminUserResponse is the public representation of an admin user (no password hash).
// Distinct from UserResponse (auth profile) — carries last-login metadata for the
// user management page.
type AdminUserResponse struct {
	ID               int    `json:"id"`
	Username         string `json:"username"`
	Email            string `json:"email"`
	Role             string `json:"role"`
	IsActive         bool   `json:"is_active"`
	LastLogin        string `json:"last_login"`   // "YYYY-MM-DD HH24:MI:SS", empty if never
	LastLoginIP      string `json:"last_login_ip"` // empty if never logged in
	LastLoginBrowser string `json:"last_login_browser"` // parsed browser name, empty if never logged in
	CreatedAt        string `json:"created_at"`   // "YYYY-MM-DD HH24:MI:SS"
}
