package response

// OnlineRegistrationResponse adalah response untuk POST /api/online-registration.
type OnlineRegistrationResponse struct {
	QueueNumber string `json:"queue_number"`
	QRCode      string `json:"qr_code"`
	Message     string `json:"message"`
}

// QueueItem adalah satu item dalam daftar antrian.
type QueueItem struct {
	Number string `json:"number"`
	Name   string `json:"name"`
	Status string `json:"status"`
}
