# UAT Summary — RSU Tangsel Care
**Version Under Test:** main (latest, Sep 1 2026)  
**Test Environment:** Docker (localhost:3000 frontend, localhost:8080 backend, localhost:8000 OCR)  
**Test Date:** September 1, 2026  
**Tester:** Automated UAT — Antigravity IDE

---

## Overall Result

| Module | File | TC Total | PASS | FAIL | Status |
|--------|------|----------|------|------|--------|
| Admin Authentication | [01_ADMIN_AUTH.md](./01_ADMIN_AUTH.md) | 4 | 4 | 0 | ✅ |
| Admin Dashboard & Queue | [02_ADMIN_DASHBOARD.md](./02_ADMIN_DASHBOARD.md) | 5 | 5 | 0 | ✅ |
| Public Website & Registration | [03_PUBLIC_WEBSITE.md](./03_PUBLIC_WEBSITE.md) | 7 | 7 | 0 | ✅ |
| MCU Package Booking & OCR Extract | [04_PACKAGE_BOOKING.md](./04_PACKAGE_BOOKING.md) | 6 | 6 | 0 | ✅ |
| OCR Service (File Upload & Extract) | [05_OCR.md](./05_OCR.md) | 3 | 3 | 0 | ✅ |
| Browser Extension | [06_BROWSER_EXTENSION.md](./06_BROWSER_EXTENSION.md) | 3 | 3 | 0 | ✅ |
| **TOTAL** | | **28** | **28** | **0** | **✅ ALL PASS** |

---

## System Architecture Under Test

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| Frontend (Next.js) | rsudtangsel-web | 3000 | ✅ Healthy |
| Backend (Go) | rsudtangsel-server | 8080 | ✅ Running |
| OCR Service (Python) | rsudtangsel-ocr | 8000 | ✅ Running |
| Database (PostgreSQL) | rsudtangsel-db | 5432 | ✅ Healthy |

---

## Test Data Summary

| Data | Count |
|------|-------|
| Dokter | 65 |
| Poliklinik | 34 |
| Jadwal Dokter | 184 |
| Paket Medical (MCU/Lab/Rad) | 17 |
| Package Bookings (existing) | 735 |
| Admin Users | 2 |
| OCR Document Types | 2 |
| Queue Registration (UAT) | 1 (nomor R001) |

---

## Key Findings

### ✅ Working Features
| Fitur | Detail |
|-------|--------|
| Admin Login | JWT Bearer token, rate-limited |
| Protected Routes | HTTP 401 tanpa token, HTTP 403 untuk role tidak sesuai |
| Dashboard Stats | BOR, antrian, dokter aktif, keluhan baru |
| Queue Management | List, call, skip, finish per antrian |
| Package Bookings | 735 data, admin dapat confirm/cancel/update |
| Public Doctors | 65 dokter + jadwal + poli info |
| Online Registration | Nomor antrian otomatis R001, validasi input |
| Medical Packages | 17 paket MCU/Lab/Radiologi |
| Booking Lookup | Pasien tracking via `booking_code` |
| OCR Document Types | 2 tipe dokumen (Inventory, Registrasi Pasien) |
| OCR File Extract | Upload file → ekstrak field dokumen (Inventory & Registrasi Pasien) ✅ Teruji |
| Browser Extension | Integrasi browser extension untuk akses cepat fitur RSU ✅ Teruji |
| Audit Logging | Setiap aksi admin ter-audit |

### ⚠️ Notes / Minor Items
| # | Item | Keterangan |
|---|------|-----------|
| 1 | Public `/api/queue` wajib parameter `?department=` | Tanpa department → 400 error (by design) |
| 2 | Server healthcheck menunjuk `/docs` tapi endpoint tidak ada → container status `unhealthy` | Tidak mempengaruhi fungsionalitas |

---

## Reproduksi UAT

```bash
# 1. Start services
cd C:\Users\Admin\OneDrive\Desktop\RSU\rsudtangsel
docker compose up -d

# 2. Akses
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8080/api
# Admin login: POST /api/admin/login {"username":"admin","password":"admin123"}

# 3. Seed data (jika perlu)
cd server
go run ./cmd/seed/
```

---

## API Reference Cepat

```
# Public
GET  /api/doctors               → 65 dokter
GET  /api/poli                  → 34 poliklinik
GET  /api/schedules             → 184 jadwal
GET  /api/medical-packages      → 17 paket
GET  /api/queue?department=UGD  → Antrian per departemen
POST /api/online-registration   → Daftar antrian (nik, name, phone_number, doctor_id, schedule_date, complaint)
POST /api/package-bookings/register → Booking MCU (patient_name, patient_nik, patient_phone, package_id, booking_date)
GET  /api/package-bookings/my-bookings?booking_code=xxx → Cek status booking

# Admin (wajib: Authorization: Bearer {token})
POST /api/admin/login                         → Login
GET  /api/admin/dashboard/stats               → Statistik harian
GET  /api/admin/queue                         → Antrian
GET  /api/admin/package-bookings              → Semua booking
POST /api/admin/package-bookings/{id}/confirm → Konfirmasi booking
POST /api/admin/package-bookings/{id}/cancel  → Batalkan booking
GET  /api/admin/users                         → Manajemen user
GET  /api/admin/ocr-document-types            → Tipe dokumen OCR
```
