package docs

import (
	"embed"
	"net/http"
)

//go:embed index.html
var content embed.FS

// Handler mengembalikan http.Handler yang menyajikan halaman
// dokumentasi API interaktif di path /docs.
func Handler() http.Handler {
	index, err := content.ReadFile("index.html")
	if err != nil {
		panic(err)
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.Write(index)
	})
}
