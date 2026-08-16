package response

// UserResponse is the public representation of a user (without password).
type UserResponse struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// LoginResponse is the response for POST /api/admin/login and POST /api/admin/refresh.
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	TokenType    string       `json:"token_type"`
	ExpiresIn    int          `json:"expires_in"` // in seconds
	User         UserResponse `json:"user"`
}

// DashboardStatsResponse is the response for GET /api/admin/dashboard/stats.
type DashboardStatsResponse struct {
	PasienHariIni   int     `json:"pasien_hari_ini"`
	RataWaktuTunggu float64 `json:"rata_waktu_tunggu"` // in minutes
	BOR             float64 `json:"bor"`               // percentage
	KeluhanBaru     int     `json:"keluhan_baru"`
	TotalAntrian    int     `json:"total_antrian"`
	UpdateTime      string  `json:"update_time"` // "HH:MM:SS"
}

// AdminAntrianItem represents a single queue entry for the admin dashboard.
type AdminAntrianItem struct {
	ID        int    `json:"id"`
	Nomor     string `json:"nomor"`
	Nama      string `json:"nama"`
	Poli      string `json:"poli"`
	Dokter    string `json:"dokter"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

// CallAntrianResponse is the response for PATCH /api/admin/antrian/:id/call.
type CallAntrianResponse struct {
	ID       int    `json:"id"`
	Nomor    string `json:"nomor"`
	Nama     string `json:"nama"`
	Poli     string `json:"poli"`
	Status   string `json:"status"`
	CalledAt string `json:"called_at"`
}
