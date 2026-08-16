package response

// UserResponse adalah representasi publik dari data user (tanpa password).
type UserResponse struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Role     string `json:"role"`
}

// LoginResponse adalah response untuk POST /api/admin/login dan POST /api/admin/refresh.
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	TokenType    string       `json:"token_type"`
	ExpiresIn    int          `json:"expires_in"` // dalam detik
	User         UserResponse `json:"user"`
}

// DashboardStatsResponse adalah response untuk GET /api/admin/dashboard/stats.
type DashboardStatsResponse struct {
	PasienHariIni   int     `json:"pasien_hari_ini"`
	RataWaktuTunggu float64 `json:"rata_waktu_tunggu"` // menit
	BOR             float64 `json:"bor"`               // persen
	KeluhanBaru     int     `json:"keluhan_baru"`
	TotalAntrian    int     `json:"total_antrian"`
	UpdateTime      string  `json:"update_time"` // "HH:MM:SS"
}

// AdminAntrianItem adalah satu baris data antrian untuk admin dashboard.
type AdminAntrianItem struct {
	ID        int    `json:"id"`
	Nomor     string `json:"nomor"`
	Nama      string `json:"nama"`
	Poli      string `json:"poli"`
	Dokter    string `json:"dokter"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

// CallAntrianResponse adalah response untuk PATCH /api/admin/antrian/:id/call.
type CallAntrianResponse struct {
	ID       int    `json:"id"`
	Nomor    string `json:"nomor"`
	Nama     string `json:"nama"`
	Poli     string `json:"poli"`
	Status   string `json:"status"`
	CalledAt string `json:"called_at"`
}
