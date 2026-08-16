package request

// DaftarOnlineRequest adalah struct untuk request body POST /api/daftar-online.
type DaftarOnlineRequest struct {
	NIK             string `json:"nik"`
	Nama            string `json:"nama"`
	TanggalLahir    string `json:"tanggal_lahir"`
	Alamat          string `json:"alamat"`
	NoHP            string `json:"no_hp"`
	Poli            string `json:"poli"`
	Dokter          string `json:"dokter"`
	Tanggal         string `json:"tanggal"`
	Jam             string `json:"jam"`
	JenisPembayaran string `json:"jenis_pembayaran"`
}
