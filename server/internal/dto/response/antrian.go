package response

// DaftarOnlineResponse adalah response untuk POST /api/daftar-online.
type DaftarOnlineResponse struct {
	NomorAntrian string `json:"nomor_antrian"`
	QRCode       string `json:"qr_code"`
	Pesan        string `json:"pesan"`
}

// AntrianItem adalah satu item dalam daftar antrian.
type AntrianItem struct {
	Nomor  string `json:"nomor"`
	Nama   string `json:"nama"`
	Status string `json:"status"`
}
