package request

// UserCreateRequest is the payload for POST /api/admin/users.
type UserCreateRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // admin | staff | dokter | backoffice | hr
	IsActive *bool  `json:"is_active"`
}

// Validate returns a non-empty error message if the request is invalid.
func (r *UserCreateRequest) Validate() string {
	if r.Username == "" {
		return "username wajib diisi"
	}
	if len(r.Username) > 50 {
		return "username maksimal 50 karakter"
	}
	if r.Email == "" {
		return "email wajib diisi"
	}
	if r.Password == "" {
		return "password wajib diisi"
	}
	if len(r.Password) < 8 {
		return "password minimal 8 karakter"
	}
	return validateUserRole(r.Role)
}

// UserUpdateRequest is the payload for PUT /api/admin/users/{id}.
// Password is optional (empty = keep current password).
type UserUpdateRequest struct {
	Email    *string `json:"email"`
	Password *string `json:"password"`
	Role     *string `json:"role"`
	IsActive *bool   `json:"is_active"`
}

// Validate returns a non-empty error message if the request is invalid.
func (r *UserUpdateRequest) Validate() string {
	if r.Email != nil && *r.Email == "" {
		return "email tidak boleh kosong"
	}
	if r.Password != nil && *r.Password != "" && len(*r.Password) < 8 {
		return "password minimal 8 karakter"
	}
	if r.Role != nil {
		return validateUserRole(*r.Role)
	}
	return ""
}

func validateUserRole(role string) string {
	switch role {
	case "admin", "staff", "dokter", "backoffice", "hr":
		return ""
	case "":
		return "role wajib diisi"
	default:
		return "role tidak valid: harus admin | staff | dokter | backoffice | hr"
	}
}
