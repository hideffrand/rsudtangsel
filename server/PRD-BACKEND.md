# PRD: Backend Sistem Antrian RSU Tangsel

> **Versi**: 1.0.0  
> **Tanggal**: 2026-08-16  
> **Status**: Phase 1 (MVP) ✅  
> **Maintainer**: Tim Backend RSU Tangsel

---

## 1. Overview

### 1.1 Nama Project
**RSU Tangsel — Backend API**  
Sistem antrian dan pendaftaran online untuk RSU Tangerang Selatan.

### 1.2 Tech Stack

| Komponen        | Teknologi                        | Versi     |
|-----------------|----------------------------------|-----------|
| Language        | Go                               | 1.22+     |
| HTTP Server     | Standard Library (`net/http`)    | bawaan    |
| Database        | PostgreSQL                       | 16-alpine |
| DB Client       | `sqlx`                           | v1.4.0    |
| Migration       | `golang-migrate`                 | v4.17.1   |
| Config          | `godotenv`                       | v1.5.1    |
| Driver DB       | `lib/pq`                         | v1.12.3   |
| Container       | Docker / Docker Compose          | latest    |
| Auth *(planned)*| JWT                              | -         |

### 1.3 Tujuan

Menyediakan REST API untuk:
1. Pendaftaran pasien secara online dengan nomor antrian otomatis
2. Monitoring antrian per poli secara real-time
3. Fondasi untuk pengembangan fitur lanjutan (jadwal dokter, chat, rekam medis)

### 1.4 Base URL

```
http://localhost:8080          # Development
https://api.rsudtangsel.id     # Production (planned)
```

---

## 2. Arsitektur

### 2.1 Clean Architecture

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Request                     │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Handler Layer                      │
│  • Parse & validasi request                         │
│  • Panggil service                                  │
│  • Format JSON response                             │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Service Layer                      │
│  • Business logic                                   │
│  • Generate nomor antrian                           │
│  • Orchestrate repository calls                     │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                Repository Layer                     │
│  • CRUD database                                    │
│  • Query SQL via sqlx                               │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL 16                      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Struktur Folder

```
server/
├── cmd/
│   └── api/
│       └── main.go                    # Entry point — DI + routing
├── internal/
│   ├── database/
│   │   └── database.go                # Koneksi PostgreSQL (sqlx)
│   ├── model/                         # Entity — representasi tabel DB
│   │   ├── pasien.go
│   │   └── pendaftaran.go
│   ├── dto/                           # Data Transfer Objects
│   │   ├── request/
│   │   │   └── daftar_online.go       # Request body struct
│   │   └── response/
│   │       └── antrian.go             # Response struct
│   ├── utils/
│   │   └── response.go                # SuccessResponse / ErrorResponse
│   ├── repository/                    # Database operations
│   │   ├── pasien_repository.go
│   │   └── pendaftaran_repository.go
│   ├── service/                       # Business logic
│   │   └── antrian_service.go
│   └── handler/                       # HTTP handlers
│       ├── daftar_online.go
│       └── antrian.go
├── migrations/                        # SQL migrations (golang-migrate)
│   ├── 20260816083700_init.up.sql
│   └── 20260816083700_init.down.sql
├── test_api.sh                        # Script full API test
├── Makefile                           # Shortcut commands
├── .env                               # Environment variables (tidak di-commit)
├── .env.example                       # Template .env
├── go.mod
└── go.sum
```

### 2.3 Alur Data (Request → Response)

```
HTTP Request
    │
    ▼
cmd/api/main.go  →  Register route ke ServeMux
    │
    ▼
handler/         →  Parse JSON body / query params
                    Validasi field wajib
    │
    ▼
service/         →  Business logic:
                    - Cek/buat pasien by NIK
                    - Hitung urutan antrian
                    - Generate nomor antrian (format: J001)
                    - Generate QR Code URL
    │
    ▼
repository/      →  Eksekusi SQL ke PostgreSQL (via sqlx)
    │
    ▼
utils/response   →  Format JSON: { "success": true, "data": {...} }
    │
    ▼
HTTP Response
```

### 2.4 Dependency Injection

Semua dependency di-inisialisasi di `main.go` dengan urutan:

```
database.Connect()
    └── repository.New*()
            └── service.New*()
                    └── handler.New*()
                            └── mux.HandleFunc()
```

---

## 3. API Specification

### Format Response

Semua endpoint mengembalikan format JSON yang konsisten:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Pesan error yang deskriptif"
}
```

---

### 3.1 Daftar Online

| Atribut    | Detail                           |
|------------|----------------------------------|
| **URL**    | `/api/daftar-online`             |
| **Method** | `POST`                           |
| **Auth**   | Tidak perlu (public)             |
| **Headers**| `Content-Type: application/json` |

**Request Body:**

| Field              | Type   | Wajib | Deskripsi                         |
|--------------------|--------|:-----:|-----------------------------------|
| `nik`              | string | ✅    | NIK KTP (16 digit)                |
| `nama`             | string | ✅    | Nama lengkap pasien               |
| `tanggal_lahir`    | string | ❌    | Format: `YYYY-MM-DD`              |
| `alamat`           | string | ❌    | Alamat lengkap                    |
| `no_hp`            | string | ✅    | Nomor HP aktif                    |
| `poli`             | string | ✅    | Nama poli tujuan                  |
| `dokter`           | string | ❌    | Nama dokter (default: Dokter Umum)|
| `tanggal`          | string | ✅    | Tanggal kunjungan `YYYY-MM-DD`    |
| `jam`              | string | ❌    | Jam kunjungan `HH:MM` (default: 08:00) |
| `jenis_pembayaran` | string | ❌    | `BPJS` / `Umum` / `Asuransi`     |

**Contoh Request:**
```json
{
  "nik": "1234567890123456",
  "nama": "Budi Santoso",
  "tanggal_lahir": "1990-01-01",
  "alamat": "Jl. Raya No. 123, Tangsel",
  "no_hp": "08123456789",
  "poli": "Jantung",
  "dokter": "dr. Ahmad Sp.JP",
  "tanggal": "2026-08-20",
  "jam": "09:00",
  "jenis_pembayaran": "BPJS"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "nomor_antrian": "J001",
    "qr_code": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=J001",
    "pesan": "Pendaftaran berhasil! Nomor antrian Anda: J001"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "NIK, Nama, No HP, Poli, dan Tanggal wajib diisi"
}
```

**Error Codes:**

| Code  | Kondisi                            |
|-------|------------------------------------|
| `200` | Pendaftaran berhasil               |
| `400` | Field wajib kosong / format salah  |
| `405` | Method bukan POST                  |
| `500` | Error server / database            |

**Business Logic:**
1. Cek pasien by NIK → jika belum ada, insert pasien baru
2. Hitung jumlah pendaftaran di poli + tanggal yang sama
3. Generate nomor antrian: prefix = huruf pertama nama poli → `Jantung` = `J001`
4. Generate QR Code URL via `api.qrserver.com`
5. Insert pendaftaran dengan status `menunggu`

---

### 3.2 Cek Antrian

| Atribut    | Detail               |
|------------|----------------------|
| **URL**    | `/api/antrian`       |
| **Method** | `GET`                |
| **Auth**   | Tidak perlu (public) |

**Query Parameters:**

| Parameter  | Type   | Wajib | Deskripsi                                   |
|------------|--------|:-----:|---------------------------------------------|
| `poli`     | string | ✅    | Nama poli (contoh: `Jantung`)               |
| `tanggal`  | string | ❌    | Format `YYYY-MM-DD` (default: hari ini)     |

**Contoh Request:**
```
GET /api/antrian?poli=Jantung&tanggal=2026-08-20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "nomor": "J001",
      "nama": "Pasien #1",
      "status": "Menunggu"
    },
    {
      "nomor": "J002",
      "nama": "Pasien #2",
      "status": "Menunggu"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Query parameter 'poli' wajib diisi"
}
```

**Error Codes:**

| Code  | Kondisi                            |
|-------|------------------------------------|
| `200` | Berhasil (data bisa array kosong)  |
| `400` | Query `poli` tidak ada             |
| `405` | Method bukan GET                   |
| `500` | Error server / database            |

---

### 3.3 API yang Direncanakan (Phase 2)

| Method   | Endpoint                  | Deskripsi                      |
|----------|---------------------------|--------------------------------|
| `GET`    | `/api/jadwal-dokter`      | Daftar jadwal dokter per poli  |
| `GET`    | `/api/pasien/:nik`        | Detail pasien by NIK           |
| `PATCH`  | `/api/antrian/:id/status` | Update status antrian          |
| `DELETE` | `/api/antrian/:id`        | Batal pendaftaran              |
| `POST`   | `/api/auth/login`         | Login admin/staff (JWT)        |
| `POST`   | `/api/auth/logout`        | Logout                         |
| `POST`   | `/api/auth/refresh`       | Refresh JWT token              |

---

## 4. Database Schema

### 4.1 ERD

```
┌──────────────┐         ┌─────────────────────┐
│    pasien    │ 1     N │    pendaftaran       │
├──────────────┤─────────├─────────────────────┤
│ id (PK)      │         │ id (PK)             │
│ nik UNIQUE   │         │ pasien_id (FK)      │
│ nama         │         │ poli                │
│ tanggal_lahir│         │ dokter              │
│ alamat       │         │ tanggal             │
│ no_hp        │         │ jam                 │
│ created_at   │         │ jenis_pembayaran    │
│ updated_at   │         │ nomor_antrian       │
└──────────────┘         │ qr_code             │
                         │ status              │
                         │ created_at          │
                         │ updated_at          │
                         └─────────────────────┘

┌───────────────────────┐
│    jadwal_dokter      │
├───────────────────────┤
│ id (PK)               │
│ poli                  │
│ dokter                │
│ hari                  │
│ jam_mulai             │
│ jam_selesai           │
│ kuota                 │
│ created_at            │
│ updated_at            │
└───────────────────────┘
```

### 4.2 Tabel: `pasien`

```sql
CREATE TABLE IF NOT EXISTS pasien (
    id            SERIAL PRIMARY KEY,
    nik           VARCHAR(20)  UNIQUE NOT NULL,
    nama          VARCHAR(100) NOT NULL,
    tanggal_lahir DATE         NOT NULL,
    alamat        TEXT,
    no_hp         VARCHAR(15)  NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 Tabel: `pendaftaran`

```sql
CREATE TABLE IF NOT EXISTS pendaftaran (
    id               SERIAL PRIMARY KEY,
    pasien_id        INTEGER      REFERENCES pasien(id),
    poli             VARCHAR(50)  NOT NULL,
    dokter           VARCHAR(100) NOT NULL,
    tanggal          DATE         NOT NULL,
    jam              TIME         NOT NULL,
    jenis_pembayaran VARCHAR(20)  NOT NULL,  -- BPJS | Umum | Asuransi
    nomor_antrian    VARCHAR(10)  NOT NULL,
    qr_code          TEXT,
    status           VARCHAR(20)  DEFAULT 'menunggu',  -- menunggu|diproses|selesai|batal
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query cepat
CREATE INDEX idx_pendaftaran_tanggal ON pendaftaran(tanggal);
CREATE INDEX idx_pendaftaran_status  ON pendaftaran(status);
CREATE INDEX idx_pendaftaran_poli    ON pendaftaran(poli);
```

### 4.4 Tabel: `jadwal_dokter`

```sql
CREATE TABLE IF NOT EXISTS jadwal_dokter (
    id           SERIAL PRIMARY KEY,
    poli         VARCHAR(50)  NOT NULL,
    dokter       VARCHAR(100) NOT NULL,
    hari         VARCHAR(10)  NOT NULL,  -- Senin | Selasa | ... | Minggu
    jam_mulai    TIME         NOT NULL,
    jam_selesai  TIME         NOT NULL,
    kuota        INTEGER      DEFAULT 20,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

### 4.5 Tabel: `users` *(planned — Phase 2)*

```sql
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  DEFAULT 'staff',  -- admin | staff | doctor
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

### 4.6 Status Pendaftaran

| Status      | Deskripsi                             |
|-------------|---------------------------------------|
| `menunggu`  | Pasien sudah daftar, belum dipanggil  |
| `diproses`  | Pasien sedang dilayani                |
| `selesai`   | Pelayanan selesai                     |
| `batal`     | Pendaftaran dibatalkan                |

---

## 5. Security

### 5.1 Authentication — JWT *(Phase 2)*

```
POST /api/auth/login
  Body: { "username": "...", "password": "..." }
  Response: { "token": "eyJ...", "expires_in": 3600 }

Header untuk protected endpoint:
  Authorization: Bearer eyJ...
```

### 5.2 Authorization — RBAC *(Phase 2)*

| Role      | Hak Akses                                      |
|-----------|------------------------------------------------|
| `admin`   | Semua endpoint                                 |
| `staff`   | Baca + Update status antrian                   |
| `doctor`  | Baca antrian poli sendiri + Update status      |
| `patient` | Hanya bisa daftar + lihat antrian (public)     |

### 5.3 Input Validation (saat ini)

| Field             | Validasi                                      |
|-------------------|-----------------------------------------------|
| `nik`             | Wajib diisi (validasi 16 digit — Phase 2)     |
| `nama`            | Wajib diisi, tidak boleh kosong               |
| `no_hp`           | Wajib diisi                                   |
| `poli`            | Wajib diisi                                   |
| `tanggal`         | Wajib diisi, format `YYYY-MM-DD`              |
| `tanggal_lahir`   | Opsional, format `YYYY-MM-DD`                 |
| `jenis_pembayaran`| Opsional (validasi enum — Phase 2)            |

### 5.4 CORS *(planned — Phase 2)*

```go
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", os.Getenv("ALLOWED_ORIGINS"))
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

---

## 6. Deployment

### 6.1 Environment Variables

File `.env` (jangan di-commit ke Git):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=rsudtangsel
DB_PASSWORD=rsudtangsel
DB_NAME=rsudtangsel
DATABASE_URL=postgresql://rsudtangsel:rsudtangsel@localhost:5432/rsudtangsel?sslmode=disable

# Server
SERVER_PORT=8080

# JWT (Phase 2)
JWT_SECRET=ganti-dengan-secret-yang-kuat-minimal-32-karakter

# WhatsApp Gateway (Phase 2)
WA_API_URL=https://api.wati.io
WA_API_KEY=your-wa-api-key

# Sentry (Phase 3)
SENTRY_DSN=https://xxx@sentry.io/yyy

# CORS (Phase 2)
ALLOWED_ORIGINS=http://localhost:3000,https://rsudtangsel.id
```

### 6.2 Docker Setup (`compose.yaml`)

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: rsudtangsel-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-rsudtangsel}
      POSTGRES_USER: ${POSTGRES_USER:-rsudtangsel}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-rsudtangsel}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-rsudtangsel} -d ${POSTGRES_DB:-rsudtangsel}"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Planned: tambahkan service server di sini
  # server:
  #   build: { context: ./server }
  #   ports: ["8080:8080"]
  #   depends_on: { db: { condition: service_healthy } }
  #   env_file: ["./server/.env"]

volumes:
  postgres-data:
```

### 6.3 Makefile Commands

```bash
make help                         # Tampilkan semua command
make run                          # Jalankan server (go run .)
make build                        # Build binary ke bin/server
make db-up                        # Start PostgreSQL via Docker
make db-down                      # Stop PostgreSQL
make migrate-up                   # Apply semua migration
make migrate-down                 # Rollback 1 migration
make migrate-create name=add_users  # Buat migration baru
make migrate-version              # Cek versi migration saat ini
make migrate-force v=1            # Force versi tertentu
```

### 6.4 CI/CD Pipeline — GitHub Actions *(planned)*

```yaml
# .github/workflows/ci.yml
name: CI — Build & Test
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: rsudtangsel_test
          POSTGRES_USER: rsudtangsel
          POSTGRES_PASSWORD: rsudtangsel
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      - name: Build
        run: cd server && go build ./cmd/api/...
      - name: Test
        run: cd server && go test ./...
```

---

## 7. Testing

### 7.1 Build Test

```bash
# Di dalam folder server/
go build ./cmd/api/...
```

### 7.2 Unit Testing *(planned — Phase 2)*

Struktur test yang direncanakan:

```
server/
└── internal/
    ├── service/
    │   └── antrian_service_test.go     # Test business logic
    └── repository/
        └── pasien_repository_test.go   # Test DB dengan testcontainers
```

```bash
go test ./internal/...
go test ./internal/... -v              # Verbose
go test ./internal/... -cover          # Coverage report
```

### 7.3 API Testing — `test_api.sh`

Script `test_api.sh` tersedia di root `server/`:

```bash
# Pastikan server sudah running, lalu:
bash test_api.sh
```

Test yang dicakup (8 test case):

| # | Test Case                                 | Validasi            |
|---|-------------------------------------------|---------------------|
| 1 | POST daftar-online — pasien baru          | `nomor_antrian` ada |
| 2 | POST daftar-online — poli berbeda         | Prefix nomor sesuai poli |
| 3 | POST daftar-online — NIK sudah ada        | Tidak duplikat pasien |
| 4 | GET antrian — dengan poli + tanggal       | Array data antrian  |
| 5 | GET antrian — poli berbeda               | Data terpisah per poli |
| 6 | POST — field wajib kosong                 | `error` di response |
| 7 | GET — tanpa query `poli`                  | `error` di response |
| 8 | DELETE — method not allowed               | `error` di response |

---

## 8. Monitoring & Logging

### 8.1 Logging *(planned — Phase 2)*

Rencana menggunakan `zerolog` (lightweight, structured logging):

```go
import "github.com/rs/zerolog/log"

log.Info().Str("poli", req.Poli).Str("nik", req.NIK).Msg("daftar-online request")
log.Error().Err(err).Msg("gagal insert pendaftaran")
```

### 8.2 Middleware Logging HTTP *(planned)*

```go
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Info().
            Str("method", r.Method).
            Str("path", r.URL.Path).
            Dur("latency", time.Since(start)).
            Msg("request")
    })
}
```

### 8.3 Metrics yang Dipantau *(planned — Phase 3)*

| Metric               | Deskripsi                          |
|----------------------|------------------------------------|
| `request_total`      | Jumlah request per endpoint        |
| `request_duration`   | Latency response (ms)              |
| `error_rate`         | Persentase response error (5xx)    |
| `antrian_per_poli`   | Jumlah antrian aktif per poli      |
| `db_connection_pool` | Jumlah koneksi DB aktif            |

### 8.4 Error Tracking — Sentry *(planned — Phase 3)*

```go
import "github.com/getsentry/sentry-go"

sentry.Init(sentry.ClientOptions{
    Dsn:              os.Getenv("SENTRY_DSN"),
    TracesSampleRate: 1.0,
    Environment:      os.Getenv("APP_ENV"),
})

sentry.CaptureException(err)
```

---

## 9. Roadmap

### Phase 1 — MVP ✅ Selesai

| Fitur | Status |
|-------|--------|
| Clean Architecture (handler/service/repository/model/dto) | ✅ |
| `POST /api/daftar-online` — pendaftaran + nomor antrian otomatis | ✅ |
| `GET /api/antrian` — cek antrian per poli | ✅ |
| Database schema (pasien, pendaftaran, jadwal_dokter) | ✅ |
| QR Code otomatis via api.qrserver.com | ✅ |
| Response format konsisten (`success/error`) | ✅ |
| Full API test suite (`test_api.sh`, 8 test case) | ✅ |

### Phase 2 — Core Features *(Next)*

| Fitur | Status |
|-------|--------|
| `GET /api/jadwal-dokter` | ⬜ |
| `GET /api/pasien/:nik` | ⬜ |
| `PATCH /api/antrian/:id/status` | ⬜ |
| `DELETE /api/antrian/:id` (batal) | ⬜ |
| JWT Authentication (`/api/auth/*`) | ⬜ |
| RBAC (admin / staff / doctor) | ⬜ |
| CORS middleware | ⬜ |
| Validasi NIK 16 digit dan format HP | ⬜ |
| Nama pasien di response GET antrian (JOIN query) | ⬜ |
| WhatsApp notification nomor antrian | ⬜ |
| Unit test (service layer) | ⬜ |

### Phase 3 — Advanced Features *(Future)*

| Fitur | Status |
|-------|--------|
| Dashboard Admin (antrian live, statistik) | ⬜ |
| QR Code Scanner (validasi kedatangan) | ⬜ |
| Laporan harian/bulanan (PDF/Excel) | ⬜ |
| Notifikasi push (Firebase FCM) | ⬜ |
| Integrasi BPJS | ⬜ |
| Monitoring (Prometheus + Grafana) | ⬜ |
| Error tracking (Sentry) | ⬜ |

### Phase 4 — Hospital Information System *(Long-term)*

| Fitur | Status |
|-------|--------|
| Rekam Medis Digital | ⬜ |
| Chat Dokter (WebSocket) | ⬜ |
| Telemedicine | ⬜ |
| HIRS (Hospital Information and Reporting System) | ⬜ |
| Integrasi ICD-10 (kode diagnosa) | ⬜ |

---

## 10. Cara Menjalankan

### 10.1 Setup Awal

```bash
# 1. Clone repository
git clone https://github.com/hideffrand/rsudtangsel.git
cd rsudtangsel

# 2. Konfigurasi environment
cp server/.env.example server/.env
# Edit server/.env sesuai kebutuhan

# 3. Jalankan PostgreSQL
make -C server db-up

# 4. Jalankan migration
make -C server migrate-up

# 5. Jalankan server (via WSL / Linux)
cd server
go run ./cmd/api/main.go
```

### 10.2 Command Harian

```bash
# Jalankan server
go run ./cmd/api/main.go

# Build binary
go build -o bin/server ./cmd/api/main.go

# Test API
bash test_api.sh

# Buat migration baru
make migrate-create name=add_users

# Apply migration
make migrate-up

# Rollback migration
make migrate-down
```

### 10.3 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `go` not found di PowerShell | Gunakan WSL: `wsl -e bash -c "cd /mnt/c/... && go run ./cmd/api/main.go"` |
| `DATABASE_URL is not set` | Pastikan file `.env` ada dan berisi `DATABASE_URL` |
| `connect: connection refused` | Jalankan PostgreSQL dulu: `make db-up` |
| `pq: duplicate key value` | NIK sudah terdaftar — normal, pasien lama tetap bisa dapat antrian baru |
| Port 8080 sudah dipakai | Ubah `SERVER_PORT` di `.env` |

---

> **Catatan**: Dokumentasi ini diperbarui seiring perkembangan project.  
> Untuk pertanyaan atau kontribusi, buka issue di repository GitHub.
