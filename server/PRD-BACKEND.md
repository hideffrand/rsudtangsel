# PRD: Backend API System - RSU Tangsel

> **Version**: 2.4.0
> **Date**: 2026-08-20
> **Status**: Phase 1 ✅ | Phase 2 ✅ | Phase 2.1 ✅ (MCU Packages) | Phase 2.2 ✅ (MCU Booking) | Phase 2.3 ✅ (OCR + Poli + Diagnostic) | Phase 2.4 ✅ (MCU Booking Number)
> **Maintainer**: RSU Tangsel Backend Team

---

## 1. Overview

### 1.1 Project Name
**RSU Tangsel - Backend API**
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
│   │   └── main.go                      # Entry point - DI + routing
│   └── seed/
│       └── main.go                      # Database seeder
├── internal/
│   ├── database/
│   │   └── database.go                  # PostgreSQL connection (sqlx)
│   ├── model/                           # Entities - DB table representations
│   │   ├── patient.go
│   │   ├── appointment.go
│   │   ├── doctor.go
│   │   ├── doctor_schedule.go
│   │   ├── user.go                      # Admin users, refresh tokens, audit logs
│   │   ├── mcu_package.go               # MCU package + items
│   │   └── mcu_booking.go               # MCU booking entity
│   ├── dto/                             # Data Transfer Objects
│   │   ├── request/
│   │   │   ├── online_register.go       # Public registration request
│   │   │   ├── doctor.go
│   │   │   ├── schedule.go
│   │   │   ├── admin.go                 # Login, refresh, change-password requests
│   │   │   ├── mcu_package.go           # MCU package create/update request
│   │   │   └── mcu_booking.go           # MCU booking register + admin update requests
│   │   └── response/
│   │       ├── queue.go                 # Public queue response
│   │       ├── doctor.go
│   │       ├── auth.go                  # Login, dashboard, admin queue responses
│   │       ├── mcu_package.go           # MCU package response
│   │       └── mcu_booking.go           # MCU booking detail + list responses
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
│   │   ├── user_repository.go           # Auth, refresh tokens, audit logs
│   │   ├── mcu_package_repository.go    # MCU package CRUD
│   │   └── mcu_booking_repository.go    # MCU booking CRUD + filters + revenue
│   ├── service/                         # Business logic
│   │   ├── queue_service.go
│   │   ├── doctor_service.go
│   │   ├── poliklinik_service.go        # Poli CRUD
│   │   ├── diagnostic_service_service.go
│   │   ├── ocr_service.go               # OCR proxy + response parsing
│   │   ├── auth_service.go              # Login, token rotation, logout
│   │   ├── dashboard_service.go         # Stats aggregation incl. active_doctors
│   │   ├── mcu_package_service.go       # MCU package business logic
│   │   └── mcu_booking_service.go       # MCU booking: pkg validation, price calc, NIK link
│   └── handler/                         # HTTP handlers
│       ├── online_registration.go
│       ├── queue.go
│       ├── doctor.go
│       ├── schedule.go
│       ├── poliklinik.go                # GET /api/poli, GET /api/poli/{id}
│       ├── diagnostic_service.go        # GET /api/diagnostic-services, /{id}
│       ├── ocr.go                       # POST /api/admin/ocr/extract (proxy)
│       ├── admin.go                     # All admin auth + queue endpoints
│       ├── mcu_package.go               # MCU package CRUD endpoints
│       └── mcu_booking.go               # MCU booking: 2 public + 6 admin endpoints
├── migrations/
│   ├── 20260816140429_init_schema.up.sql          # patients, doctors, appointments, doctor_schedules
│   ├── 20260816140429_init_schema.down.sql
│   ├── 20260816090000_add_admin_tables.up.sql     # users, refresh_tokens, audit_logs
│   ├── 20260816090000_add_admin_tables.down.sql
│   ├── 20260816150452_mcu_packages.up.sql         # mcu_packages, mcu_package_items
│   ├── 20260816150452_mcu_packages.down.sql
│   ├── 20260817000000_add_mcu_bookings.up.sql     # mcu_bookings (TEXT[] diagnostics)
│   ├── 20260817000000_add_mcu_bookings.down.sql
│   ├── 20260819000000_add_poliklinik.up.sql       # poliklinik table + doctors.poli_id FK
│   ├── 20260819000000_add_poliklinik.down.sql
│   ├── 20260819010000_add_diagnostic_services.up.sql  # diagnostic_services, diagnostic_service_items
│   └── 20260819010000_add_diagnostic_services.down.sql
├── Makefile
├── Dockerfile                                    # Multi-stage Docker build
├── entrypoint.sh                                 # Docker entrypoint (migrate + run)
├── .env
└── go.mod / go.sum
```

### 2.3 Middleware Chain

```
All routes:
  CORSMiddleware
  → RequestLoggerMiddleware  # structured [HTTP] METHOD PATH → STATUS latency (IP)

Public routes (/api/online-registration, /api/queue, /api/doctors, /api/schedules,
               /api/poli, /api/mcu-packages, /api/diagnostic-services,
               /api/mcu/register, /api/mcu/my-bookings):
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

## 3.4 MCU Package Endpoints

> MCU = Medical Check-Up. These endpoints manage available health screening packages offered by the hospital.
> All endpoints are **public** (no auth required for reading; write operations may be protected in a future iteration).

---

### 3.4.1 List MCU Packages

| Attribute  | Detail                  |
|------------|-------------------------|
| **URL**    | `GET /api/mcu-packages` |
| **Auth**   | None (public)           |

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": [
    {
      "id": 1,
      "name": "Paket MCU Basic",
      "description": "Pemeriksaan kesehatan dasar",
      "price": 350000,
      "is_active": true,
      "items": [
        { "id": 1, "name": "Darah Lengkap", "description": "Complete blood count" },
        { "id": 2, "name": "Urin Lengkap", "description": "Urinalysis" }
      ]
    }
  ]
}
```

---

### 3.4.2 Get MCU Package Detail

| Attribute  | Detail                       |
|------------|------------------------------|
| **URL**    | `GET /api/mcu-packages/{id}` |
| **Auth**   | None (public)                |

**Response (404 Not Found):**
```json
{ "success": false, "status_code": 404, "message": "mcu package not found" }
```

---

### 3.4.3 Create MCU Package

| Attribute  | Detail                        |
|------------|-------------------------------|
| **URL**    | `POST /api/mcu-packages`      |
| **Auth**   | None (public - to be secured) |

**Request Body:**
```json
{
  "name": "Paket MCU Premium",
  "description": "Pemeriksaan kesehatan menyeluruh",
  "price": 750000,
  "is_active": true,
  "items": [
    { "name": "EKG", "description": "Elektrokardiogram" },
    { "name": "Rontgen Dada", "description": "Chest X-Ray" },
    { "name": "Gula Darah", "description": "Blood glucose" }
  ]
}
```

**Request Fields:**

| Field         | Type    | Required | Description                              |
|---------------|---------|:--------:|------------------------------------------|
| `name`        | string  | ✅       | Package name                             |
| `description` | string  | ❌       | Package description (default: `""`)      |
| `price`       | int64   | ✅       | Price in IDR (Rupiah), must be `>= 0`   |
| `is_active`   | bool    | ❌       | Whether the package is active (default: `true`) |
| `items`       | array   | ❌       | List of check-up items in this package   |
| `items[].name`| string  | ✅       | Item name (e.g. `"Darah Lengkap"`)       |
| `items[].description` | string | ❌ | Item description                      |

**Response (201 Created):** Same structure as detail response.

**Validation:**
- `name` must not be empty
- `price` must be `>= 0`

---

### 3.4.4 Update MCU Package

| Attribute  | Detail                        |
|------------|-------------------------------|
| **URL**    | `PUT /api/mcu-packages/{id}`  |
| **Auth**   | None (public - to be secured) |

**Request Body:** Same as Create. Replaces all items (cascade delete + re-insert).

**Response (200 OK):** Updated package object.

**Error (404):** Package not found.

---

### 3.4.5 Delete MCU Package

| Attribute  | Detail                           |
|------------|----------------------------------|
| **URL**    | `DELETE /api/mcu-packages/{id}`  |
| **Auth**   | None (public - to be secured)    |

Deletes the package and all its items (`ON DELETE CASCADE`).

**Response (200 OK):**
```json
{ "success": true, "status_code": 200, "data": null, "message": "mcu package deleted" }
```

**Error (404):** Package not found.

---

### 3.4.6 Error Codes (MCU Endpoints)

| Code  | Condition                                     |
|-------|-----------------------------------------------|
| `200` | Success                                       |
| `201` | Package created successfully                  |
| `400` | Invalid request body / missing required fields |
| `404` | Package not found                             |
| `405` | Method not allowed                            |
| `500` | Server / database error                       |

---

## 3.5 MCU Booking Endpoints

> Patients can register an MCU appointment online without creating an account.
> Admin can manage, confirm, cancel, and update payments.

---

### 3.5.1 Register MCU Booking (Public)

| Attribute | Detail |
|-----------|--------|
| **URL**   | `POST /api/mcu/register` |
| **Auth**  | None (public) |

**Request Body:**

| Field           | Type     | Required | Description |
|-----------------|----------|:--------:|-------------|
| `package_id`    | int      | ✅ | MCU package ID from `/api/mcu-packages` |
| `booking_date`  | string   | ✅ | `YYYY-MM-DD` |
| `booking_time`  | string   | ✅ | `HH:MM` |
| `nik`           | string   | ✅ | National ID, exactly 16 digits |
| `full_name`     | string   | ✅ | Patient full name |
| `birth_date`    | string   | ✅ | `YYYY-MM-DD` |
| `phone_number`  | string   | ✅ | Active phone number |
| `address`       | string   | ❌ | Patient address |
| `lab_tests`     | string[] | ❌ | Selected lab tests (see options below) |
| `radiology_tests` | string[] | ❌ | Selected radiology tests |
| `payment_method`| string   | ❌ | `transfer` / `qris` / `cash` / `bpjs` |
| `notes`         | string   | ❌ | Additional notes |

**Available `lab_tests` values:**
`hematologi` `gula_darah` `kolesterol` `asam_urat` `fungsi_hati` `fungsi_ginjal` `lipid` `urinalisis` `hormon` `tes_kehamilan`

**Available `radiology_tests` values:**
`rontgen` `usg` `ct_scan` `mri` `mammografi` `ekg` `treadmill`

**Add-on Pricing (IDR):**

| Test | Price |
|------|-------|
| hematologi | Rp 50.000 |
| gula_darah | Rp 25.000 |
| kolesterol | Rp 35.000 |
| asam_urat | Rp 30.000 |
| fungsi_hati | Rp 75.000 |
| fungsi_ginjal | Rp 75.000 |
| lipid | Rp 60.000 |
| urinalisis | Rp 30.000 |
| hormon | Rp 150.000 |
| tes_kehamilan | Rp 35.000 |
| rontgen | Rp 100.000 |
| usg | Rp 150.000 |
| ct_scan | Rp 500.000 |
| mri | Rp 800.000 |
| mammografi | Rp 200.000 |
| ekg | Rp 85.000 |
| treadmill | Rp 175.000 |

**Price Formula:** `total = package.price + sum(lab_test_fees) + sum(radiology_fees)`

**Response (201 Created):**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": 1,
    "package_id": 3,
    "package_name": "MCU Gold",
    "nik": "1234567890123456",
    "full_name": "Budi Santoso",
    "phone_number": "08123456789",
    "birth_date": "1990-01-01",
    "address": "Jl. Raya No. 123",
    "booking_date": "2026-08-25",
    "booking_time": "09:00:00",
    "lab_tests": ["hematologi", "gula_darah"],
    "radiology_tests": ["rontgen"],
    "status": "pending",
    "total_price": 875000,
    "payment_status": "unpaid",
    "payment_method": "transfer",
    "notes": "",
    "created_at": "2026-08-16 22:39:00"
  },
  "message": "MCU booking registered successfully"
}
```

**Error Codes:**

| Code | Condition |
|------|-----------|
| `400` | Missing/invalid required fields |
| `400` | NIK not exactly 16 digits |
| `404` | Package not found or inactive |
| `500` | Server error |

---

### 3.5.2 Get My Bookings (Public)

| Attribute | Detail |
|-----------|--------|
| **URL**   | `GET /api/mcu/my-bookings?nik={NIK}` |
| **Auth**  | None (public) |

Returns all MCU bookings for a patient identified by their NIK.

**Response (200 OK):**
```json
{
  "success": true,
  "status_code": 200,
  "data": [
    {
      "id": 1,
      "package_name": "MCU Gold",
      "full_name": "Budi Santoso",
      "nik": "1234567890123456",
      "phone_number": "08123456789",
      "booking_date": "2026-08-25",
      "booking_time": "09:00:00",
      "status": "pending",
      "total_price": 875000,
      "created_at": "2026-08-16 22:39:00"
    }
  ]
}
```

---

### 3.5.3 Admin - List MCU Bookings

| Attribute | Detail |
|-----------|--------|
| **URL**   | `GET /api/admin/mcu/bookings` |
| **Auth**  | `Bearer <token>` - role: admin / staff |

**Query Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `status`  | string | Filter: `pending` / `confirmed` / `completed` / `cancelled` |
| `tanggal` | string | Filter by booking date `YYYY-MM-DD` |

---

### 3.5.4 Admin - Get Booking Detail

| Attribute | Detail |
|-----------|--------|
| **URL**   | `GET /api/admin/mcu/bookings/{id}` |
| **Auth**  | `Bearer <token>` - role: admin / staff |

---

### 3.5.5 Admin - Update Booking (Partial)

| Attribute | Detail |
|-----------|--------|
| **URL**   | `PATCH /api/admin/mcu/bookings/{id}/update` |
| **Auth**  | `Bearer <token>` - role: admin / staff |

```json
{ "status": "confirmed", "payment_status": "awaiting_confirmation", "notes": "" }
```

---

### 3.5.6 Admin - Confirm / Cancel / Payment Shortcuts

| Method  | URL | Action |
|---------|-----|--------|
| `PATCH` | `/api/admin/mcu/bookings/{id}/confirm` | Set `status = confirmed` |
| `PATCH` | `/api/admin/mcu/bookings/{id}/cancel` | Set `status = cancelled` |
| `PATCH` | `/api/admin/mcu/bookings/{id}/payment/confirm` | Set `payment_status = paid` |

---

### 3.5.7 Status & Payment Flows

**Booking Status:**
```
pending → confirmed → completed
    └→ cancelled      └→ cancelled
```

**Payment Status:**
```
unpaid → awaiting_confirmation → paid
                    └→ cancelled
```

---

### 3.5.8 Error Codes (All MCU Booking Endpoints)

| Code | Condition |
|------|-----------|
| `200` | Success |
| `201` | Booking created |
| `400` | Invalid body / missing fields / invalid status value |
| `401` | Missing or expired token (admin endpoints) |
| `403` | Insufficient role |
| `404` | Booking not found / package not found |
| `405` | Method not allowed |
| `500` | Server / database error |

### 3.2.1 Login

| Attribute   | Detail                           |
|-------------|----------------------------------|
| **URL**     | `POST /api/admin/login`          |
| **Auth**    | None - rate limited (100/min)    |

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

**Response (200 OK):** Same structure as Login - new `access_token` + new `refresh_token` (rotation).

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
| **Auth**   | `Bearer <token>` - role: admin / staff  |

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
| **Auth**   | `Bearer <token>` - role: admin / staff  |

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
| **Auth**   | `Bearer <token>` - role: admin / staff              |

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
| **Auth**   | `Bearer <token>` - role: admin / staff              |

Sets appointment status to `cancelled`.

**Response (200 OK):** Same structure as call - `status: "Cancelled"`.

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
│   mcu_packages   │ 1     N │  mcu_package_items   │
├──────────────────┤─────────├──────────────────────┤
│ id (PK)          │         │ id (PK)              │
│ name             │         │ package_id (FK)      │
│ description      │         │ name                 │
│ price (IDR)      │         │ description          │
│ is_active        │         │ position             │
│ created_at       │         │ created_at           │
│ updated_at       │         └──────────────────────┘
└──────────────────┘

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

### 4.2 MCU Package Tables

**`mcu_packages`** - Master list of health screening packages:

| Column        | Type          | Description                     |
|---------------|---------------|---------------------------------|
| `id`          | SERIAL PK     | Auto-increment primary key      |
| `name`        | VARCHAR(100)  | Package name                    |
| `description` | TEXT          | Package description             |
| `price`       | BIGINT        | Price in IDR (Rupiah)           |
| `is_active`   | BOOLEAN       | Whether package is active       |
| `created_at`  | TIMESTAMP     | Creation timestamp              |
| `updated_at`  | TIMESTAMP     | Last update timestamp           |

**`mcu_package_items`** - Check-up items within each package:

| Column        | Type          | Description                     |
|---------------|---------------|---------------------------------|
| `id`          | SERIAL PK     | Auto-increment primary key      |
| `package_id`  | INTEGER FK    | References `mcu_packages(id)` with CASCADE DELETE |
| `name`        | VARCHAR(150)  | Item name (e.g. "Darah Lengkap") |
| `description` | TEXT          | Item description                |
| `position`    | INTEGER       | Display ordering (default: 0)   |
| `created_at`  | TIMESTAMP     | Creation timestamp              |

---

### 4.3 Appointment Status Values

| Status        | Description                          |
|---------------|--------------------------------------|
| `waiting`     | Patient registered, not yet called   |
| `processing`  | Patient is currently being served    |
| `done`        | Service completed                    |
| `cancelled`   | Appointment cancelled / skipped      |

### 4.4 User Roles

| Role      | Access                                             |
|-----------|----------------------------------------------------|
| `admin`   | All admin endpoints                                |
| `staff`   | Read + call/skip queue                             |
| `doctor`  | Read own specialty queue (planned)                 |

---

## 5. Security

### 5.1 Authentication - JWT (Implemented ✅)

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
- Written **asynchronously** (non-blocking goroutine) - no latency impact
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

# Auth - IMPORTANT: set a strong 256-bit secret in production!
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
| `20260816090000_add_admin_tables.up.sql`    | Creates `users`, `refresh_tokens`, `audit_logs`   |
| `20260816150452_mcu_packages.up.sql`        | Creates `mcu_packages`, `mcu_package_items`       |
| `20260817000000_add_mcu_bookings.up.sql`    | Creates `mcu_bookings` (TEXT[] diagnostics, payment, status) |

**Default admin credentials (seeded):**
- Username: `admin`
- Password: `admin123`
- **⚠️ Change immediately in production!**

---

## 8. Roadmap

### Phase 1 - Public Queue MVP ✅ Complete

| Feature | Status |
|---------|--------|
| Clean Architecture (handler/service/repository/model/dto) | ✅ |
| `POST /api/daftar-online` - registration + auto queue number | ✅ |
| `GET /api/antrian` - queue check per specialty | ✅ |
| QR Code auto-generated via api.qrserver.com | ✅ |
| Consistent response format (`success/error`) | ✅ |

### Phase 2 - Admin Dashboard ✅ Complete

| Feature | Status |
|---------|--------|
| Database schema refactor (patients, doctors, appointments) | ✅ |
| `GET /api/doctors` - doctor list | ✅ |
| `GET /api/doctors/{id}` - doctor detail | ✅ |
| `GET /api/doctors/{id}/schedules` - doctor schedules | ✅ |
| `GET /api/schedules` - all schedules | ✅ |
| `POST /api/admin/login` - JWT login (rate limited) | ✅ |
| `POST /api/admin/refresh` - token rotation | ✅ |
| `POST /api/admin/logout` - revoke refresh token | ✅ |
| `GET /api/admin/dashboard/stats` - live statistics | ✅ |
| `GET /api/admin/antrian` - admin queue view (with patient & doctor details) | ✅ |
| `PATCH /api/admin/antrian/{id}/call` - call patient | ✅ |
| `PATCH /api/admin/antrian/{id}/skip` - skip patient | ✅ |
| CORS middleware | ✅ |
| JWT Auth middleware (HS256) | ✅ |
| Role-based access (admin / staff) | ✅ |
| Sliding window rate limiter | ✅ |
| Async audit logging | ✅ |
| bcrypt password hashing (cost 10) | ✅ |
| Admin seed credentials via `.env` (not hardcoded in SQL) | ✅ |

### Phase 2.1 - MCU Packages ✅ Complete

| Feature | Status |
|---------|--------|
| `GET /api/mcu-packages` - list all packages (with nested items) | ✅ |
| `GET /api/mcu-packages/{id}` - package detail | ✅ |
| `POST /api/mcu-packages` - create package + items | ✅ |
| `PUT /api/mcu-packages/{id}` - update package + items (full replace) | ✅ |
| `DELETE /api/mcu-packages/{id}` - delete package + cascade items | ✅ |
| `mcu_packages` + `mcu_package_items` DB tables | ✅ |

### Phase 2.2 - MCU Booking Registration ✅ Complete

| Feature | Status |
|---------|--------|
| `POST /api/mcu/register` - public MCU booking with package + add-on diagnostics | ✅ |
| `GET /api/mcu/my-bookings?nik=` - patient booking history (by NIK) | ✅ |
| `GET /api/admin/mcu/bookings` - admin list (filter by status/date) | ✅ |
| `GET /api/admin/mcu/bookings/{id}` - booking detail | ✅ |
| `PATCH /api/admin/mcu/bookings/{id}/update` - partial update (status/payment/notes) | ✅ |
| `PATCH /api/admin/mcu/bookings/{id}/confirm` - confirm booking | ✅ |
| `PATCH /api/admin/mcu/bookings/{id}/cancel` - cancel booking | ✅ |
| `PATCH /api/admin/mcu/bookings/{id}/payment/confirm` - mark as paid | ✅ |
| `mcu_bookings` DB table (TEXT[] for lab/radiology arrays) | ✅ |
| Add-on pricing: 10 lab tests + 7 radiology tests | ✅ |
| Auto-link booking to `patients` by NIK (nullable) | ✅ |
| Booking status flow: `pending → confirmed → completed / cancelled` | ✅ |
| Payment status flow: `unpaid → awaiting_confirmation → paid / cancelled` | ✅ |

### Phase 3 - Advanced Features *(Planned)*

| Feature | Status |
|---------|--------|
| `POST /api/admin/users` - create staff accounts | ⬜ |
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

### Phase 4 - Hospital Information System *(Long-term)*

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
# Edit server/.env - set DATABASE_URL and JWT_SECRET

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

---

## 10. Phase 2.3 — OCR Service, Poliklinik & Diagnostic Services (2026-08-20)

### 10.1 New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/poli` | Public | List all poliklinik |
| `GET` | `/api/poli/{id}` | Public | Get single poli |
| `GET` | `/api/diagnostic-services` | Public | List lab + radiology services |
| `GET` | `/api/diagnostic-services/{id}` | Public | Get single service |
| `POST` | `/api/admin/ocr/extract` | Admin | Extract data from uploaded document (Python OCR service proxy) |

### 10.2 New Files (from teammate)

| File | Purpose |
|------|---------|
| `handler/ocr.go` | Proxy handler — forwards multipart/form-data to Python OCR microservice |
| `service/ocr_service.go` | OCR business logic: calls `ocr-service` Python API, parses response |
| `internal/docs/docs.go` | Swagger/OpenAPI docs entry |
| `internal/docs/index.html` | Swagger UI served at `/docs` |
| `ocr-service/` | Python FastAPI OCR microservice (Tesseract + OpenCV) |
| `Dockerfile` | Multi-stage Docker build for Go server |
| `entrypoint.sh` | Docker entrypoint: runs `migrate up` then starts server |

### 10.3 Dashboard Stats — `active_doctors` Field Added

`GET /api/admin/dashboard/stats` response now includes:

```json
{
  "patients_today": 12,
  "avg_wait_time": 14.5,
  "bor": 75.0,
  "new_complaints": 12,
  "total_queue": 5,
  "active_doctors": 8,
  "update_time": "06:25:00"
}
```

`active_doctors` = `COUNT(DISTINCT doctor_id)` from appointments where `schedule_date = today`.

### 10.4 Middleware — Request Logger Added

All requests now logged in format:
```
[HTTP] GET /api/poli -> 200 1.068s ([::1])
```

Chain: `CORSMiddleware` → `RequestLoggerMiddleware` → handler/admin middleware

### 10.5 Database Schema Updates

| Migration | Tables |
|-----------|--------|
| `20260819000000_add_poliklinik` | `poliklinik` + `doctors.poli_id FK` |
| `20260819010000_add_diagnostic_services` | `diagnostic_services`, `diagnostic_service_items` |

### 10.6 Phase 2.3 Checklist

- [x] `GET /api/poli` + `GET /api/poli/{id}`
- [x] `GET /api/diagnostic-services` + `GET /api/diagnostic-services/{id}`
- [x] OCR handler + service (proxy to Python microservice)
- [x] `active_doctors` in dashboard stats response
- [x] Request logger middleware
- [x] Docker + entrypoint.sh for containerized deployment
- [x] Swagger/OpenAPI docs (`/docs`)
- [ ] `POST /api/admin/ocr/extract` — pending frontend integration
- [ ] OCR service wired into admin protected router

---

## 11. Phase 2.4 — MCU Booking Number (2026-08-20)

### 11.1 Overview

Added unique booking number generation to the MCU registration flow. Each MCU booking now receives a human-readable identifier tied to the booking date.

### 11.2 Changes

| Component | Change |
|-----------|--------|
| `migrations/20260820000000_add_mcu_booking_number` | `ALTER TABLE mcu_bookings ADD COLUMN booking_number VARCHAR(20) UNIQUE` |
| `model/mcu_booking.go` | Add `BookingNumber string` field (`db:"booking_number"`) |
| `service/mcu_booking_service.go` | `generateMcuBookingNumber(date, seq)` called before `Create` |
| `repository/mcu_booking_repository.go` | `Create` includes `$17 booking_number`; `FindByID` + `findList` SELECT + Scan updated |
| `dto/response/mcu_booking.go` | `BookingNumber` added to `McuBookingResponse` + `McuBookingListItem` |

### 11.3 Booking Number Format

```
MCU{DD}{MM}{YY}-{seq:03d}
```

- `DD` = day of booking date
- `MM` = month
- `YY` = last 2 digits of year
- `seq` = daily sequential counter (resets each day, zero-padded to 3 digits)

**Examples:**
```
MCU250826-001   ← 1st booking on 2026-08-25
MCU250826-002   ← 2nd booking on 2026-08-25
MCU260826-001   ← 1st booking on 2026-08-26 (resets)
```

### 11.4 Verified Test Output (2026-08-20)

```bash
curl -X POST http://localhost:8080/api/mcu/register \
  -H 'Content-Type: application/json' \
  -d '{
    "package_id": 1, "booking_date": "2026-08-25", "booking_time": "09:00",
    "nik": "3674051708980001", "full_name": "Budi Santoso",
    "birth_date": "1998-08-17", "phone_number": "08123456789",
    "payment_method": "transfer",
    "lab_tests": ["hematologi", "gula_darah"]
  }'
```

**Response:**
```json
{
  "success": true,
  "status_code": 201,
  "data": {
    "id": 1,
    "booking_number": "MCU250826-001",
    "package_id": 1,
    "package_name": "Paket MCU Hemat",
    "nik": "3674051708980001",
    "full_name": "Budi Santoso",
    "booking_date": "2026-08-25",
    "booking_time": "09:00:00",
    "lab_tests": ["hematologi", "gula_darah"],
    "radiology_tests": [],
    "status": "pending",
    "total_price": 325000,
    "payment_status": "unpaid",
    "payment_method": "transfer",
    "created_at": "2026-08-20 06:39:05"
  },
  "message": "MCU booking registered successfully"
}
```

**Price breakdown:**
- Paket MCU Hemat base: Rp 250.000
- Hematologi add-on: Rp 50.000
- Gula Darah add-on: Rp 25.000
- **Total: Rp 325.000** ✅

### 11.5 Phase 2.4 Checklist

- [x] Migration: `booking_number VARCHAR(20) UNIQUE` column added
- [x] Model: `BookingNumber` field
- [x] Service: generate `MCU{DDMMYY}-{seq:03d}` before booking create
- [x] Repository: `Create`, `FindByID`, `findList` all include `booking_number`
- [x] Response DTO: `booking_number` in detail + list responses
- [x] Live test: `MCU250826-001` returned with correct price calculation ✅

