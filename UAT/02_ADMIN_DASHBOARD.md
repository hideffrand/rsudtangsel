# UAT Report — Module: Admin Dashboard
**System:** RSU Tangsel Care  
**URL:** http://localhost:8080/api/admin/dashboard  
**Tester:** Automated UAT (Antigravity)  
**Date:** September 1, 2026  
**Module:** Admin Dashboard & Queue Management

---

## Test Summary

| TC ID | Scenario | Status |
|-------|----------|--------|
| TC-DASH-001 | Dashboard Statistics | ✅ PASS |
| TC-QUEUE-001 | Admin Queue List | ✅ PASS |
| TC-QUEUE-002 | Queue Filter by Department | ✅ PASS |
| TC-PKG-001 | Package Bookings List | ✅ PASS |
| TC-USER-001 | User Management List | ✅ PASS |

**Result: 5 / 5 PASS**

---

## Detailed Test Results

### TC-DASH-001: Dashboard Statistics
| | |
|-|-|
| **Endpoint** | `GET /api/admin/dashboard/stats` |
| **Expected** | Angka statistik harian tampil |
| **Actual** | ✅ Data: `patients_today: 0, avg_wait_time: 0, bor: 75%, new_complaints: 12, total_queue: 0, active_doctors: 0, update_time: 11:46:07` |
| **Status** | **PASS** |

---

### TC-QUEUE-001: Admin Queue List
| | |
|-|-|
| **Endpoint** | `GET /api/admin/queue` |
| **Expected** | Daftar antrian hari ini |
| **Actual** | ✅ Response berhasil — 0 antrian aktif hari ini (sesuai kondisi testing) |
| **Status** | **PASS** |

---

### TC-QUEUE-002: Queue Filter by Department
| | |
|-|-|
| **Endpoint** | `GET /api/queue?department=UGD` |
| **Expected** | Antrian UGD tampil |
| **Actual** | ✅ Response berhasil dengan filter departemen |
| **Note** | Parameter `department` wajib pada public queue endpoint |
| **Status** | **PASS** |

---

### TC-PKG-001: Package Bookings List (Admin)
| | |
|-|-|
| **Endpoint** | `GET /api/admin/package-bookings` |
| **Expected** | List semua booking MCU/Lab/Radiologi |
| **Actual** | ✅ **735 bookings** terdaftar |
| **Status** | **PASS** |

---

### TC-USER-001: User Management List
| | |
|-|-|
| **Endpoint** | `GET /api/admin/users` |
| **Expected** | Daftar akun staff sistem |
| **Actual** | ✅ **2 users** (admin + 1 staff) |
| **Status** | **PASS** |

---

## Notes
- BOR (Bed Occupancy Rate) dihitung dinamis — nilai 75% dari DB
- Queue management mendukung action: `call`, `skip`, `finish`
- Package bookings mendukung admin action: `confirm`, `cancel`, `update`
