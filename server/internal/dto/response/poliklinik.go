package response

// PoliklinikResponse adalah response untuk data master poliklinik (poli).
type PoliklinikResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}
