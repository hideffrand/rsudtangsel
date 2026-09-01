# UAT Report — Module: Browser Extension
**System:** RSU Tangsel Care  
**Platform:** Browser Extension (Chromium-based)  
**Tester:** Manual UAT — Tim RSU Tangsel  
**Date:** September 1, 2026  
**Module:** Browser Extension

---

## Test Summary

| TC ID | Scenario | Status |
|-------|----------|--------|
| TC-EXT-001 | Extension Install & Load | ✅ PASS |
| TC-EXT-002 | Extension Interaksi dengan Sistem RSU | ✅ PASS |
| TC-EXT-003 | Extension Akses Data dari Backend | ✅ PASS |

**Result: 3 / 3 PASS — Teruji oleh tim**

---

## Detailed Test Results

### TC-EXT-001: Extension Install & Load
| | |
|-|-|
| **Platform** | Chromium-based browser |
| **Location** | `browser-extension/` |
| **Expected** | Extension berhasil di-install dan aktif |
| **Actual** | ✅ **PASS** — Teruji oleh tim |
| **Status** | **PASS** |

---

### TC-EXT-002: Extension Interaksi dengan Sistem RSU
| | |
|-|-|
| **Expected** | Extension dapat berinteraksi dengan halaman web RSU Tangsel |
| **Actual** | ✅ **PASS** — Teruji oleh tim |
| **Status** | **PASS** |

---

### TC-EXT-003: Extension Akses Data dari Backend
| | |
|-|-|
| **Expected** | Extension dapat mengambil/mengirim data via API RSU Tangsel |
| **Actual** | ✅ **PASS** — Teruji oleh tim |
| **Status** | **PASS** |

---

## Notes
- Source code extension ada di folder `browser-extension/`
- Extension menggunakan API dari backend RSU Tangsel (`http://localhost:8080/api`)
- Tested oleh tim yang berbeda — hasil konfirmasi PASS
