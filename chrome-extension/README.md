# Webform Copilot (Chrome Extension)

Chrome Extension (Manifest V3) yang membantu pengisian form web di rumah sakit dengan memotret / mengunggah dokumen lalu mengekstrak datanya lewat OCR. Semua tampilan ada di dalam satu **side panel**.

## Fitur

- **Login / Auth** — autentikasi ke backend Go (`POST /api/admin/login`). Token disimpan di `chrome.storage.session` (ephemeral, hilang saat browser ditutup), refresh token otomatis dirotasi saat mendekati kedaluwarsa.
- **Aplikasi utama** — pilih jenis dokumen (mock: *Registrasi Pasien* / *Inventory*), ambil foto (kamera) atau unggah gambar, lalu proses ke `POST /api/admin/ocr/extract` di server Go (yang mem-proxy ke microservice Python OCR). Hasil field ekstraksi + teks mentah ditampilkan.
- **Pengaturan** — ubah base URL server Go dan tombol keluar (logout).

## Arsitektur

```text
[ Side Panel (Next.js static export) ]
   ├── LoginView   → POST {baseUrl}/api/admin/login        → chrome.storage.session
   ├── MainView    → POST {baseUrl}/api/admin/ocr/extract  (Bearer token)
   └── SettingsView→ base URL di chrome.storage.local + logout

[ Background service worker ] → membuka side panel saat ikon diklik
```

- Build dengan Next.js 14 (`output: "export"`), background di-bundle terpisah lewat esbuild.
- `scripts/postbuild.mjs` mengganti nama file/direktori berawalan `_` (Next.js memproduksi `_next/`, `_app-*.js`, dsb.) — Chrome menolak unpacked extension yang mengandung nama reserved tersebut, lalu menulis ulang referensinya.
- CORS: server Go mengizinkan semua origin saat `ALLOWED_ORIGINS` kosong (dev). Untuk produksi tambahkan `chrome-extension://<id>` ke `ALLOWED_ORIGINS`.

## Prasyarat & menjalankan

```bash
npm install

# Server Go (auth + OCR proxy):
#   cd ../server && go run ./cmd/api        (butuh DATABASE_URL, admin di-seed dari env)
# Microservice OCR (agar /api/admin/ocr/extract tidak 502):
#   cd ../ocr-service && uvicorn main:app --port 8000 --reload

npm run build
# Muat folder out/ via chrome://extensions → Load unpacked
```

> Selalu pakai `npm run build` (bukan `npm run build:next` saja). `next build` menulis ulang `out/`
> dan memproduksi file berawalan `_`; langkah `postbuild` (renama `_next/` → `next-assets/` dst.)
> sudah dibundel ke dalam `build:next` supaya hasil build selalu bisa dimuat Chrome. Jika esbuild gagal
> karena beda platform (Windows vs WSL), jalankan `npm install @esbuild/<platform>-<arch>@0.23.1 --no-save`.

## Struktur

```
src/
├── background/index.ts        # membuka side panel saat action diklik
├── components/
│   ├── LoginView.tsx          # form login ke backend auth
│   ├── MainView.tsx           # capture/upload + selector dokumen + hasil OCR
│   └── SettingsView.tsx       # base URL server + logout
├── lib/
│   ├── auth.ts                # login / refresh / logout / sesi
│   ├── ocr.ts                 # panggil /api/admin/ocr/extract
│   ├── settings.ts            # chrome.storage.local
│   └── types.ts               # Settings, AuthSession, OcrResult, dll.
└── pages/
    ├── sidepanel.tsx          # shell 3 view (login / main / settings)
    └── index.tsx              # placeholder
```

## Catatan

- Sesi disimpan di `chrome.storage.session` — tidak bertahan setelah browser ditutup (sesuai PRD FR-1.2).
- Endpoint OCR `POST /api/admin/ocr/extract` (proteksi Bearer) dan varian publik `/api/ocr/extract` keduanya ada di server Go.
- `doc_type` dikirim apa adanya; parser OCR service memakai parser generic untuk jenis yang belum dikenal (lihat `ocr-service/doc_parser.py`).
