# UAT Report — Module: Public Website & Online Registration
**System:** RSU Tangsel Care  
**URL:** http://localhost:3000 (web) | http://localhost:8080/api (backend)  
**Tester:** Automated UAT (Antigravity)  
**Date:** September 1, 2026  
**Module:** Public Website, Doctors, Poli, Registration

---

## Test Summary

| TC ID | Scenario | Status |
|-------|----------|--------|
| TC-WEB-001 | Public Website Accessible | ✅ PASS |
| TC-PUB-001 | Doctors List | ✅ PASS |
| TC-PUB-002 | Poliklinik List | ✅ PASS |
| TC-PUB-003 | Doctor Schedules | ✅ PASS |
| TC-PUB-004 | Medical Packages Catalog | ✅ PASS |
| TC-REG-001 | Online Registration — Valid | ✅ PASS |
| TC-REG-002 | Online Registration — Missing Fields | ✅ PASS |

**Result: 7 / 7 PASS**

---

## Detailed Test Results

### TC-WEB-001: Public Website Accessible
| | |
|-|-|
| **URL** | `http://localhost:3000` |
| **Expected** | Website RSU Tangsel Care dapat diakses |
| **Actual** | ✅ HTTP **200 OK** — halaman utama berhasil dimuat |
| **Status** | **PASS** |

---

### TC-PUB-001: Doctors List
| | |
|-|-|
| **Endpoint** | `GET /api/doctors` |
| **Expected** | Daftar dokter lengkap |
| **Actual** | ✅ **65 dokter** tersedia dengan nama, spesialisasi, foto |
| **Sample** | Dr. dr. Faisal Reza, Sp.Rad — Radiologi |
| **Status** | **PASS** |

---

### TC-PUB-002: Poliklinik List
| | |
|-|-|
| **Endpoint** | `GET /api/poli` |
| **Expected** | Daftar poli/departemen |
| **Actual** | ✅ **34 poliklinik** terdaftar |
| **Status** | **PASS** |

---

### TC-PUB-003: Doctor Schedules
| | |
|-|-|
| **Endpoint** | `GET /api/doctors/{id}/schedules` |
| **Sample** | Dr. Faisal Reza (id=65): Kamis & Jumat 09:00, quota 20/hari |
| **Expected** | Jadwal praktek dokter tampil |
| **Actual** | ✅ Jadwal lengkap dengan `day_of_week`, `start_time`, `quota` |
| **Status** | **PASS** |

---

### TC-PUB-004: Medical Packages Catalog
| | |
|-|-|
| **Endpoint** | `GET /api/medical-packages` |
| **Expected** | Katalog paket MCU, Lab, Radiologi |
| **Actual** | ✅ **17 paket** tersedia — dimulai dari *"Paket MCU Hemat"* (id=1) |
| **Status** | **PASS** |

---

### TC-REG-001: Online Registration — Valid
| | |
|-|-|
| **Endpoint** | `POST /api/online-registration` |
| **Payload** | `nik, name, phone_number, doctor_id=65, schedule_date=today, complaint` |
| **Expected** | Nomor antrian di-generate |
| **Actual** | ✅ `queue_number: R001` — registrasi berhasil |
| **Status** | **PASS** |

---

### TC-REG-002: Online Registration — Missing Required Fields
| | |
|-|-|
| **Endpoint** | `POST /api/online-registration` |
| **Payload** | Payload tidak lengkap (tanpa `nik`) |
| **Expected** | Validasi error dikembalikan |
| **Actual** | ✅ Error: *"nik, name, phone_number, doctor_id, and schedule_date are required"* |
| **Status** | **PASS** |

---

## Notes
- Semua endpoint public tidak butuh auth token
- Nomor antrian di-generate secara otomatis format `R{NNN}`
- Jadwal dokter mencakup `day_of_week`, `start_time`, `end_time`, `quota`
