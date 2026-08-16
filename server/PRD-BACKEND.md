# PRD: Backend API System — RSU Tangsel

> **Version**: 2.0.0
> **Date**: 2026-08-16
> **Status**: Phase 1 ✅ | Phase 2 ✅ (Admin Dashboard)
> **Maintainer**: RSU Tangsel Backend Team

---

## 1. Overview

### 1.1 Project Name
**RSU Tangsel — Backend API**
Queue management and online registration system for RSU Tangerang Selatan.

### 1.2 Tech Stack

| Component       | Technology                         | Version   |
|-----------------|------------------------------------|-----------|
| Language        | Go                                 | 1.25.0    |
| HTTP Server     | Standard Library (`net/http`)      | built-in  |
| Database        | PostgreSQL                         | 16-alpine |
| DB Client       | `sqlx`                             | v1.4.0    |
| Migration       | `golang-migrate`                   | v4.17.1   |
| Config          | `godotenv`                         | v1.5.1    |
| DB Driver       | `lib/pq`                           | v1.12.3   |
| Auth            | `golang-jwt/jwt/v5`                | v5.3.1    |
| Password Hash   | `golang.org/x/crypto` (bcrypt)     | v0.55.0   |
| Container       | Docker / Docker Compose            | latest    |

### 1.3 Goals

Provide a REST API for:
1. Online patient registration with automatic queue number generation
2. Real-time queue monitoring per specialty (public)
3. Admin dashboard for queue management with JWT authentication
4. Doctor and schedule management
5. Foundation for future features (medical records, chat, reporting)

### 1.4 Base URL

```
http://localhost:8080          # Development
https://api.rsudtangsel.id     # Production (planned)
```

---

## 2. Architecture

### 2.1 Clean Architecture

```
┌─────────────────────────────────────────────────────┐
│                    HTTP Request                     │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│              Middleware Layer                       │
│  • CORS (all routes)                                │
│  • RateLimitMiddleware (login endpoint)             │
│  • AuthMiddleware (protected routes)                │
│  • RoleMiddleware (admin / staff)                   │
│  • AuditMiddleware (async audit logging)            │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Handler Layer                      │
│  • Parse & validate request                         │
│  • Call service                                     │
│  • Format JSON response                             │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  Service Layer                      │
│  • Business logic                                   │
│  • Queue number generation                          │
│  • JWT generation & bcrypt verification             │
│  • Orchestrate repository calls                     │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                Repository Layer                     │
│  • CRUD database                                    │
│  • SQL queries via sqlx                             │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL 16                      │
└─────────────────────────────────────────────────────┘
```

### 2.2 Folder Structure

```
server/
├── cmd/
│   ├── api/
│   │   └── main.go                      # Entry point — DI + routing
│   └── seed/
│       └── main.go                      # Database seeder
├── internal/
│   ├── database/
│   │   └── database.go                  # PostgreSQL connection (sqlx)
│   ├── model/                           # Entities — DB table representations
│   │   ├── patient.go
│   │   ├── appointment.go
│   │   ├── doctor.go
│   │   ├── doctor_schedule.go
│   │   └── user.go                      # Admin users, refresh tokens, audit logs
│   ├── dto/                             # Data Transfer Objects
│   │   ├── request/
│   │   │   ├── daftar_online.go         # Public registration request
│   │   │   ├── doctor.go
│   │   │   ├── schedule.go
│   │   │   └── admin.go                 # Login, refresh, change-password requests
│   │   └── response/
│   │       ├── antrian.go               # Public queue response
│   │       ├── doctor.go
│   │       └── auth.go                  # Login, dashboard, admin queue responses
│   ├── utils/
│   │   └── response.go                  # SuccessResponse / ErrorResponse helpers
│   ├── middleware/                       # Security middleware
│   │   ├── cors.go                      # CORS with configurable origins
│   │   ├── auth.go                      # JWT validation + RoleMiddleware
│   │   ├── rate_limit.go               # Sliding window per-IP rate limiter
│   │   └── audit.go                     # Async audit log writer
│   ├── repository/                      # Database operations
│   │   ├── patient_repository.go
│   │   ├── appointment_repository.go    # Includes admin dashboard query methods
│   │   ├── doctor_repository.go
│   │   ├── doctor_schedule_repository.go
│   │   └── user_repository.go           # Auth, refresh tokens, audit logs
│   ├── service/                         # Business logic
│   │   ├── antrian_service.go
│   │   ├── doctor_service.go
│   │   ├── auth_service.go              # Login, token rotation, logout
│   │   └── dashboard_service.go         # Stats aggregation
│   └── handler/                         # HTTP handlers
│       ├── online_registration.go
│       ├── antrian.go
│       ├── doctor.go
│       ├── schedule.go
│       └── admin.go                     # All 6 admin endpoints
├── migrations/
│   ├── 20260816140429_init_schema.up.sql    # patients, doctors, appointments, doctor_schedules
│   ├── 20260816140429_init_schema.down.sql
│   ├── 20260816090000_add_admin_tables.up.sql   # users, refresh_tokens, audit_logs
│   └── 20260816090000_add_admin_tables.down.sql
├── Makefile
├── .env
└── go.mod / go.sum
```

### 2.3 Middleware Chain

```
All routes:
  CORS middleware

Public routes (/api/daftar-online, /api/antrian, /api/doctors, /api/schedules):
  → Handler (no auth required)

Login:
  → RateLimitMiddleware (100 req/min per IP, sliding window)
  → AdminHandler.Login

Protected admin routes (/api/admin/*):
  → AuthMiddleware (JWT HS256 validation)
  → RoleMiddleware (admin or staff)
  → AuditMiddleware (async DB write)
  → Handler
```

---

## 3. API Specification

### Response Format

All endpoints return a consistent JSON structure:

**Success:**
```json
{
  "success": true,
  "status_code": 200,
  "data": { ... },
  "message": "optional message"
}
```

**Error:**
```json
{
  "success": false,
  "status_code": 400,
  "message": "Descriptive error message",
  "data": null
}
```

---

## 3.1 Public Endpoints

### 3.1.1 Online Registration

| Attribute  | Detail                           |
|------------|----------------------------------|
| **URL**    | `/api/daftar-online`             |
| **Method** | `POST`                           |
| **Auth**   | None (public)                    |

**Request Body:**

| Field          | Type   | Required | Description                        |
|----------------|--------|:--------:|------------------------------------|
| `nik`          | string | ✅       | National ID (16 digits)            |
| `name`         | string | ✅       | Patient full name                  |
| `birth_date`   | string | ❌       | Format: `YYYY-MM-DD`              |
| `address`      | string | ❌       | Full address                       |
| `phone_number` | string | ✅       | Active phone number                |
| `doctor_id`    | int    | ✅       | Doctor ID from `/api/doctors`      |
| `schedule_date`| string | ✅       | Appointment date `YYYY-MM-DD`      |
| `time`         | string | ❌       | Visit time `HH:MM` (default: 08:00)|
| `payment_type` | string | ❌       | `BPJS` / `Umum` / `Asuransi`      |

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "queue_number": "J001",
    "qr_code": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=J001",
    "message": "Registration successful! Your queue number: J001"
  }
}
```

---

### 3.1.2 Check Queue

| Attribute  | Detail               |
|------------|----------------------|
| **URL**    | `/api/antrian`       |
| **Method** | `GET`                |
| **Auth**   | None (public)        |

**Query Parameters:**

| Parameter    | Type   | Required | Description                               |
|--------------|--------|:--------:|-------------------------------------------|
| `poli`       | string | ✅       | Specialty name (e.g. `Jantung`)           |
| `tanggal`    | string | ❌       | Format `YYYY-MM-DD` (default: today)      |

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": [
    { "nomor": "J001", "nama": "Patient Name", "status": "Waiting" }
  ]
}
```

---

### 3.1.3 Doctor List

| Attribute  | Detail               |
|------------|----------------------|
| **URL**    | `/api/doctors`       |
| **Method** | `GET`                |
| **Auth**   | None (public)        |

**Query Parameters:** `specialty`, `status`

---

### 3.1.4 Doctor Detail

| Attribute  | Detail                  |
|------------|-------------------------|
| **URL**    | `/api/doctors/{id}`     |
| **Method** | `GET`, `PUT`, `DELETE`  |
| **Auth**   | None (public)           |

---

### 3.1.5 Doctor Schedules

| Attribute  | Detail                            |
|------------|-----------------------------------|
| **URL**    | `/api/doctors/{id}/schedules`     |
| **Method** | `GET`                             |
| **Auth**   | None (public)                     |

---

### 3.1.6 Schedule List

| Attribute  | Detail               |
|------------|----------------------|
| **URL**    | `/api/schedules`     |
| **Method** | `GET`, `POST`        |
| **Auth**   | None (public)        |

---

### 3.1.7 Schedule Detail

| Attribute  | Detail                  |
|------------|-------------------------|
| **URL**    | `/api/schedules/{id}`   |
| **Method** | `GET`, `PUT`, `DELETE`  |
| **Auth**   | None (public)           |

---

## 3.2 Admin Authentication Endpoints

### 3.2.1 Login

| Attribute   | Detail                           |
|-------------|----------------------------------|
| **URL**     | `POST /api/admin/login`          |
| **Auth**    | None — rate limited (100/min)    |

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "a89eff30046ebc7b435000b006b37a76...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@rsutangsel.go.id",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

**Error Codes:**

| Code  | Condition                              |
|-------|----------------------------------------|
| `200` | Login successful                       |
| `400` | Missing username or password           |
| `401` | Invalid username or password           |
| `429` | Rate limit exceeded (100 req/min)      |

---

### 3.2.2 Refresh Token

| Attribute  | Detail                    |
|------------|---------------------------|
| **URL**    | `POST /api/admin/refresh` |
| **Auth**   | None (uses refresh token) |

**Request Body:**
```json
{ "refresh_token": "a89eff30046ebc7b435000b006b37a76..." }
```

**Response (200 OK):** Same structure as Login — new `access_token` + new `refresh_token` (rotation).

---

### 3.2.3 Logout

| Attribute  | Detail                    |
|------------|---------------------------|
| **URL**    | `POST /api/admin/logout`  |
| **Auth**   | `Bearer <access_token>`   |

**Request Body:**
```json
{ "refresh_token": "a89eff30046ebc7b435000b006b37a76..." }
```

**Response (200 OK):**
```json
{ "success": true, "status_code": 200, "data": null, "message": "Logged out successfully" }
```

---

## 3.3 Admin Dashboard Endpoints

> All endpoints below require: `Authorization: Bearer <access_token>`
> Required roles: `admin` or `staff`

---

### 3.3.1 Dashboard Statistics

| Attribute  | Detail                                  |
|------------|-----------------------------------------|
| **URL**    | `GET /api/admin/dashboard/stats`        |
| **Auth**   | `Bearer <token>` — role: admin / staff  |

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "pasien_hari_ini": 24,
    "rata_waktu_tunggu": 12.5,
    "bor": 75.0,
    "keluhan_baru": 12,
    "total_antrian": 8,
    "update_time": "14:26:20"
  }
}
```

**Field Descriptions:**

| Field              | Type    | Description                                   |
|--------------------|---------|-----------------------------------------------|
| `pasien_hari_ini`  | int     | Unique patients registered today              |
| `rata_waktu_tunggu`| float   | Average waiting time in minutes (done appts)  |
| `bor`              | float   | Bed Occupancy Rate in % (mocked until beds table exists) |
| `keluhan_baru`     | int     | New complaints (mocked until complaints table)|
| `total_antrian`    | int     | Total appointments still in `waiting` status today |
| `update_time`      | string  | Time this data was generated (`HH:MM:SS` UTC) |

---

### 3.3.2 Admin Queue List

| Attribute  | Detail                                  |
|------------|-----------------------------------------|
| **URL**    | `GET /api/admin/antrian`                |
| **Auth**   | `Bearer <token>` — role: admin / staff  |

**Query Parameters:**

| Parameter  | Type   | Required | Description                               |
|------------|--------|:--------:|-------------------------------------------|
| `poli`     | string | ❌       | Filter by specialty (e.g. `Jantung`)      |
| `tanggal`  | string | ❌       | Filter by date `YYYY-MM-DD` (default: today) |

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": [
    {
      "id": 1,
      "nomor": "J001",
      "nama": "Budi Santoso",
      "poli": "Jantung",
      "dokter": "dr. Ahmad Sp.JP",
      "status": "Waiting",
      "created_at": "08:30:00"
    }
  ]
}
```

**Field Descriptions:**

| Field       | Type   | Description                                    |
|-------------|--------|------------------------------------------------|
| `id`        | int    | Appointment ID (used in call/skip endpoints)   |
| `nomor`     | string | Queue number (e.g. `J001`)                     |
| `nama`      | string | Patient full name                              |
| `poli`      | string | Specialty / department                         |
| `dokter`    | string | Doctor name                                    |
| `status`    | string | `Waiting` / `Processing` / `Done` / `Cancelled`|
| `created_at`| string | Registration time `HH:MM:SS`                   |

---

### 3.3.3 Call Patient

| Attribute  | Detail                                              |
|------------|-----------------------------------------------------|
| **URL**    | `PATCH /api/admin/antrian/{id}/call`                |
| **Auth**   | `Bearer <token>` — role: admin / staff              |

Sets appointment status to `processing` (patient is being served).

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": {
    "id": 1,
    "nomor": "J001",
    "nama": "Budi Santoso",
    "poli": "Jantung",
    "status": "Processing",
    "called_at": "09:15:32"
  }
}
```

---

### 3.3.4 Skip Patient

| Attribute  | Detail                                              |
|------------|-----------------------------------------------------|
| **URL**    | `PATCH /api/admin/antrian/{id}/skip`                |
| **Auth**   | `Bearer <token>` — role: admin / staff              |

Sets appointment status to `cancelled`.

**Response (200 OK):** Same structure as call — `status: "Cancelled"`.

---

### 3.3.5 Error Codes (All Admin Endpoints)

| Code  | Condition                                          |
|-------|----------------------------------------------------|
| `200` | Success                                            |
| `400` | Invalid request body / URL format                  |
| `401` | Missing token / invalid token / expired token      |
| `403` | Insufficient role (not admin or staff)             |
| `429` | Rate limit exceeded (login endpoint only)          |
| `500` | Server / database error                            |

---

## 4. Database Schema

### 4.1 ERD

```
┌──────────────────┐         ┌──────────────────────┐
│     patients     │ 1     N │     appointments     │
├──────────────────┤─────────├──────────────────────┤
│ id (PK)          │         │ id (PK)              │
│ nik UNIQUE       │         │ patient_id (FK)      │
│ name             │         │ doctor_id (FK)       │
│ birth_date       │         │ schedule_date        │
│ address          │         │ time                 │
│ phone_number     │         │ payment_type         │
│ created_at       │         │ queue_number         │
│ updated_at       │         │ qr_code              │
└──────────────────┘         │ status               │
                             │ created_at           │
                             │ updated_at           │
                             └──────────────────────┘
                                       N
                                       │
                             ┌─────────┘
┌──────────────────┐         │
│     doctors      │ 1     N │
├──────────────────┤─────────┘
│ id (PK)          │
│ name             │   ┌──────────────────────┐
│ specialty        │ 1 │  doctor_schedules    │
│ license_number   │───├──────────────────────┤
│ email            │ N │ id (PK)              │
│ phone_number     │   │ doctor_id (FK)       │
│ bio              │   │ day_of_week          │
│ status           │   │ start_time           │
│ created_at       │   │ end_time             │
│ updated_at       │   │ quota                │
└──────────────────┘   └──────────────────────┘

┌──────────────────┐         ┌──────────────────────┐
│      users       │ 1     N │   refresh_tokens     │
├──────────────────┤─────────├──────────────────────┤
│ id (PK)          │         │ id (PK)              │
│ username UNIQUE  │         │ user_id (FK)         │
│ email UNIQUE     │         │ token UNIQUE         │
│ password_hash    │         │ expires_at           │
│ role             │         │ created_at           │
│ is_active        │         └──────────────────────┘
│ last_login       │
│ created_at       │   ┌──────────────────────┐
│ updated_at       │ 1 │    audit_logs        │
└──────────────────┘───├──────────────────────┤
                     N │ id (PK)              │
                       │ user_id (FK, NULL)   │
                       │ action               │
                       │ ip_address           │
                       │ user_agent           │
                       │ details (JSONB)      │
                       │ created_at           │
                       └──────────────────────┘
```

### 4.2 Appointment Status Values

| Status        | Description                          |
|---------------|--------------------------------------|
| `waiting`     | Patient registered, not yet called   |
| `processing`  | Patient is currently being served    |
| `done`        | Service completed                    |
| `cancelled`   | Appointment cancelled / skipped      |

### 4.3 User Roles

| Role      | Access                                             |
|-----------|----------------------------------------------------|
| `admin`   | All admin endpoints                                |
| `staff`   | Read + call/skip queue                             |
| `doctor`  | Read own specialty queue (planned)                 |

---

## 5. Security

### 5.1 Authentication — JWT (Implemented ✅)

```
POST /api/admin/login
  Body: { "username": "...", "password": "..." }
  Response: { "access_token": "eyJ...", "refresh_token": "...", "expires_in": 3600 }

Authorization header for protected endpoints:
  Authorization: Bearer eyJ...
```

| Property      | Value                  |
|---------------|------------------------|
| Algorithm     | HMAC-SHA256 (HS256)    |
| Access Token  | 1 hour expiry          |
| Refresh Token | 7 days expiry, rotated |
| Password Hash | bcrypt cost 10         |

### 5.2 Rate Limiting (Implemented ✅)

- **Algorithm**: Sliding window counter per IP address
- **Limit**: 100 requests/minute (configurable via `RATE_LIMIT_PER_MINUTE`)
- **Applied to**: `POST /api/admin/login` only
- **Response on exceed**: `429 Too Many Requests` + `Retry-After: 60`

### 5.3 CORS (Implemented ✅)

- Allowed origins configured via `ALLOWED_ORIGINS` environment variable
- Handles OPTIONS preflight requests
- Credentials allowed

### 5.4 Audit Logging (Implemented ✅)

- Every protected admin request is recorded in `audit_logs`
- Written **asynchronously** (non-blocking goroutine) — no latency impact
- Captures: `user_id`, `action`, `ip_address`, `user_agent`, `details (JSON)`

### 5.5 Input Validation

| Field      | Validation                                |
|------------|-------------------------------------------|
| `username` | Required, 3–50 characters                 |
| `password` | Required, min 6 characters               |
| Appointment ID (URL) | Must be positive integer        |
| Action (call/skip)   | Enum: `call` or `skip`          |

---

## 6. Environment Variables

```env
# Database
DATABASE_URL=postgresql://rsudtangsel:rsudtangsel@localhost:5432/rsudtangsel?sslmode=disable

# Server
SERVER_PORT=8080

# Auth — IMPORTANT: set a strong 256-bit secret in production!
JWT_SECRET=your-256-bit-secret-here
ACCESS_TOKEN_EXPIRY=3600         # seconds (default: 1 hour)
REFRESH_TOKEN_EXPIRY=604800      # seconds (default: 7 days)
BCRYPT_COST=10

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://rsudtangsel.id

# Rate limiting
RATE_LIMIT_PER_MINUTE=100
```

---

## 7. Migrations

| File                                        | Description                                       |
|---------------------------------------------|---------------------------------------------------|
| `20260816140429_init_schema.up.sql`         | Creates `patients`, `doctors`, `appointments`, `doctor_schedules` |
| `20260816090000_add_admin_tables.up.sql`    | Creates `users`, `refresh_tokens`, `audit_logs` + seeds default admin |

**Default admin credentials (seeded):**
- Username: `admin`
- Password: `admin123`
- **⚠️ Change immediately in production!**

---

## 8. Roadmap

### Phase 1 — Public Queue MVP ✅ Complete

| Feature | Status |
|---------|--------|
| Clean Architecture (handler/service/repository/model/dto) | ✅ |
| `POST /api/daftar-online` — registration + auto queue number | ✅ |
| `GET /api/antrian` — queue check per specialty | ✅ |
| QR Code auto-generated via api.qrserver.com | ✅ |
| Consistent response format (`success/error`) | ✅ |

### Phase 2 — Admin Dashboard ✅ Complete

| Feature | Status |
|---------|--------|
| Database schema refactor (patients, doctors, appointments) | ✅ |
| `GET /api/doctors` — doctor list | ✅ |
| `GET /api/doctors/{id}` — doctor detail | ✅ |
| `GET /api/doctors/{id}/schedules` — doctor schedules | ✅ |
| `GET /api/schedules` — all schedules | ✅ |
| `POST /api/admin/login` — JWT login (rate limited) | ✅ |
| `POST /api/admin/refresh` — token rotation | ✅ |
| `POST /api/admin/logout` — revoke refresh token | ✅ |
| `GET /api/admin/dashboard/stats` — live statistics | ✅ |
| `GET /api/admin/antrian` — admin queue view (with patient & doctor details) | ✅ |
| `PATCH /api/admin/antrian/{id}/call` — call patient | ✅ |
| `PATCH /api/admin/antrian/{id}/skip` — skip patient | ✅ |
| CORS middleware | ✅ |
| JWT Auth middleware (HS256) | ✅ |
| Role-based access (admin / staff) | ✅ |
| Sliding window rate limiter | ✅ |
| Async audit logging | ✅ |
| bcrypt password hashing (cost 10) | ✅ |

### Phase 3 — Advanced Features *(Planned)*

| Feature | Status |
|---------|--------|
| `POST /api/admin/users` — create staff accounts | ⬜ |
| BOR from real beds table | ⬜ |
| Complaints table + keluhan_baru real query | ⬜ |
| WhatsApp notification for queue number | ⬜ |
| QR Code scanner (arrival validation) | ⬜ |
| Daily/monthly reports (PDF/Excel) | ⬜ |
| Unit tests (service layer) | ⬜ |
| Structured logging (zerolog) | ⬜ |
| Metrics (Prometheus + Grafana) | ⬜ |
| Error tracking (Sentry) | ⬜ |
| GitHub Actions CI/CD | ⬜ |

### Phase 4 — Hospital Information System *(Long-term)*

| Feature | Status |
|---------|--------|
| Digital Medical Records | ⬜ |
| Doctor Chat (WebSocket) | ⬜ |
| Telemedicine | ⬜ |
| HIRS (Hospital Information and Reporting System) | ⬜ |
| ICD-10 integration (diagnosis codes) | ⬜ |
| BPJS integration | ⬜ |

---

## 9. Running Locally

### 9.1 Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/hideffrand/rsudtangsel.git
cd rsudtangsel

# 2. Configure environment
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and JWT_SECRET

# 3. Start PostgreSQL
make -C server db-up

# 4. Run migrations
make -C server migrate-up

# 5. Start the server (via WSL)
cd server
go run ./cmd/api/main.go
```

### 9.2 Daily Commands

```bash
go run ./cmd/api/main.go          # Start server
go build -o bin/server ./cmd/api  # Build binary
go build ./...                     # Verify build (no output = success)
make migrate-up                   # Apply migrations
make migrate-down                 # Rollback 1 migration
make migrate-create name=xxx      # Create new migration
```

### 9.3 Quick API Test

```bash
# Login and get token
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token to access dashboard
curl http://localhost:8080/api/admin/dashboard/stats \
  -H "Authorization: Bearer <access_token>"

# Call a patient (set status to processing)
curl -X PATCH http://localhost:8080/api/admin/antrian/1/call \
  -H "Authorization: Bearer <access_token>"
```

### 9.4 Troubleshooting

| Problem | Solution |
|---------|----------|
| `go` not found in PowerShell | Use WSL: `wsl -e go run ./cmd/api/main.go` |
| `DATABASE_URL is not set` | Ensure `.env` exists with `DATABASE_URL` |
| `connect: connection refused` | Start PostgreSQL first: `make db-up` |
| Port 8080 already in use | Change `SERVER_PORT` in `.env`, or run `fuser -k 8080/tcp` |
| Login returns 401 | Re-run migration to apply correct bcrypt hash |

---

> **Note**: This document is updated as the project evolves.
> For questions or contributions, open an issue on the GitHub repository.
