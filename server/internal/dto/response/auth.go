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
	PatientsToday   int     `json:"patients_today"`
	AverageWaitTime float64 `json:"avg_wait_time"`  // in minutes
	BOR             float64 `json:"bor"`            // percentage
	NewComplaints   int     `json:"new_complaints"`
	TotalQueue      int     `json:"total_queue"`
	ActiveDoctors   int     `json:"active_doctors"` // count of active doctors today
	UpdateTime      string  `json:"update_time"`    // "HH:MM:SS"
}

// AdminQueueItem represents a single queue entry for the admin dashboard.
type AdminQueueItem struct {
	ID          int    `json:"id"`
	Number      string `json:"number"`
	PatientName string `json:"patient_name"`
	Poli        string `json:"poli"`
	DoctorName  string `json:"doctor_name"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
}

// CallQueueResponse is the response for PATCH /api/admin/queue/:id/call.
type CallQueueResponse struct {
	ID          int    `json:"id"`
	Number      string `json:"number"`
	PatientName string `json:"patient_name"`
	Poli        string `json:"poli"`
	Status      string `json:"status"`
	CalledAt    string `json:"called_at"`
}
