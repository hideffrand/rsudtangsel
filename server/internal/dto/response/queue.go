package response

// DaftarOnlineResponse adalah response untuk POST /api/daftar-online.
type DaftarOnlineResponse struct {
	QueueNumber string `json:"queue_number"`
	QRCode      string `json:"qr_code"`
	Message     string `json:"message"`
}

// AntrianItem adalah satu item dalam daftar antrian.
type AntrianItem struct {
	Number string `json:"number"`
	Name   string `json:"name"`
	Status string `json:"status"`
}
