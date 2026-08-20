package request

// LoginRequest is the request body for POST /api/admin/login.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Validate checks all fields in LoginRequest and returns an error message if invalid.
func (r *LoginRequest) Validate() string {
	if r.Username == "" {
		return "username is required"
	}
	if len(r.Username) < 3 || len(r.Username) > 50 {
		return "username must be between 3 and 50 characters"
	}
	if r.Password == "" {
		return "password is required"
	}
	if len(r.Password) < 6 {
		return "password must be at least 6 characters"
	}
	return ""
}

// RefreshTokenRequest is the request body for POST /api/admin/refresh.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Validate checks all fields in RefreshTokenRequest.
func (r *RefreshTokenRequest) Validate() string {
	if r.RefreshToken == "" {
		return "refresh_token is required"
	}
	return ""
}

// ChangePasswordRequest is the request body for POST /api/admin/change-password.
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// Validate checks all fields in ChangePasswordRequest.
func (r *ChangePasswordRequest) Validate() string {
	if r.OldPassword == "" {
		return "old_password is required"
	}
	if r.NewPassword == "" {
		return "new_password is required"
	}
	if len(r.NewPassword) < 8 {
		return "new_password must be at least 8 characters"
	}
	return ""
}

// UpdateQueueStatusRequest is the request body for PATCH /api/admin/queue/:id/call.
type UpdateQueueStatusRequest struct {
	// Action: "call" sets status to "processing", "skip" sets status to "cancelled"
	Action string `json:"action"`
}

// Validate checks all fields in UpdateQueueStatusRequest.
func (r *UpdateQueueStatusRequest) Validate() string {
	if r.Action != "call" && r.Action != "skip" {
		return "action must be 'call' or 'skip'"
	}
	return ""
}
