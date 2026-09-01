# UAT Report — Module: Admin Authentication
**System:** RSU Tangsel Care  
**URL:** http://localhost:8080/api/admin  
**Tester:** Automated UAT (Antigravity)  
**Date:** September 1, 2026  
**Module:** Admin Authentication & Session

---

## Test Summary

| TC ID | Scenario | Status |
|-------|----------|--------|
| TC-AUTH-001 | Admin Login — Valid Credentials | ✅ PASS |
| TC-AUTH-002 | Admin Me — Get Profile | ✅ PASS |
| TC-AUTH-003 | Wrong Password Rejected | ✅ PASS |
| TC-AUTH-004 | Protected Route Blocked without Token | ✅ PASS |

**Result: 4 / 4 PASS**

---

## Detailed Test Results

### TC-AUTH-001: Admin Login — Valid Credentials
| | |
|-|-|
| **Endpoint** | `POST /api/admin/login` |
| **Payload** | `{ "username": "admin", "password": "admin123" }` |
| **Expected** | JWT access token dikembalikan |
| **Actual** | ✅ `access_token` diterima, role: admin |
| **Status** | **PASS** |

---

### TC-AUTH-002: Admin Me — Get Profile
| | |
|-|-|
| **Endpoint** | `GET /api/admin/me` |
| **Auth** | Bearer token dari login |
| **Expected** | Data profil admin dikembalikan |
| **Actual** | ✅ `username: admin` dikembalikan |
| **Status** | **PASS** |

---

### TC-AUTH-003: Wrong Password Rejected
| | |
|-|-|
| **Endpoint** | `POST /api/admin/login` |
| **Payload** | `{ "username": "admin", "password": "wrong" }` |
| **Expected** | HTTP 4xx error, login ditolak |
| **Actual** | ✅ HTTP **400 Bad Request** — login ditolak |
| **Status** | **PASS** |

---

### TC-AUTH-004: Protected Route Blocked without Token
| | |
|-|-|
| **Endpoint** | `GET /api/admin/dashboard/stats` (tanpa header Authorization) |
| **Expected** | HTTP 401 Unauthorized |
| **Actual** | ✅ HTTP **401 Unauthorized** |
| **Status** | **PASS** |

---

## Notes
- Auth menggunakan Bearer JWT (bukan cookie)
- Rate limiting aktif pada `/api/admin/login`
- Setiap aksi admin tercatat via `AuditMiddleware`
