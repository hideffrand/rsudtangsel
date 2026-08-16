package request

// LoginRequest adalah body untuk POST /api/admin/login.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Validate memvalidasi field LoginRequest.
func (r *LoginRequest) Validate() string {
	if r.Username == "" {
		return "username wajib diisi"
	}
	if len(r.Username) < 3 || len(r.Username) > 50 {
		return "username harus antara 3-50 karakter"
	}
	if r.Password == "" {
		return "password wajib diisi"
	}
	if len(r.Password) < 6 {
		return "password minimal 6 karakter"
	}
	return ""
}

// RefreshTokenRequest adalah body untuk POST /api/admin/refresh.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Validate memvalidasi field RefreshTokenRequest.
func (r *RefreshTokenRequest) Validate() string {
	if r.RefreshToken == "" {
		return "refresh_token wajib diisi"
	}
	return ""
}

// ChangePasswordRequest adalah body untuk POST /api/admin/change-password.
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// Validate memvalidasi field ChangePasswordRequest.
func (r *ChangePasswordRequest) Validate() string {
	if r.OldPassword == "" {
		return "old_password wajib diisi"
	}
	if r.NewPassword == "" {
		return "new_password wajib diisi"
	}
	if len(r.NewPassword) < 8 {
		return "new_password minimal 8 karakter"
	}
	return ""
}

// UpdateAntrianStatusRequest adalah body untuk PATCH /api/admin/antrian/:id/call.
type UpdateAntrianStatusRequest struct {
	// Action: "call" → status menjadi "diproses", "skip" → status menjadi "batal"
	Action string `json:"action"`
}

// Validate memvalidasi UpdateAntrianStatusRequest.
func (r *UpdateAntrianStatusRequest) Validate() string {
	if r.Action != "call" && r.Action != "skip" {
		return "action harus 'call' atau 'skip'"
	}
	return ""
}
