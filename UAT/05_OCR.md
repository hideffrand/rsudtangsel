# UAT Report — Module: OCR Service (File Upload & Extract)
**System:** RSU Tangsel Care  
**URL:** http://localhost:8000 (OCR microservice) | http://localhost:8080/api/ocr (proxy)  
**Tester:** Manual UAT — Tim RSU Tangsel  
**Date:** September 1, 2026  
**Module:** OCR Service — Document Extraction

---

## Test Summary

| TC ID | Scenario | Status |
|-------|----------|--------|
| TC-OCR-001 | OCR Service Health — Container Running | ✅ PASS |
| TC-OCR-002 | OCR Document Types — Inventory | ✅ PASS |
| TC-OCR-003 | OCR Document Types — Registrasi Pasien | ✅ PASS |

**Result: 3 / 3 PASS — Teruji oleh tim**

---

## Detailed Test Results

### TC-OCR-001: OCR Service Health
| | |
|-|-|
| **Service** | `rsudtangsel-ocr` (Python FastAPI) |
| **Port** | 8000 |
| **Expected** | Container berjalan dan siap menerima request |
| **Actual** | ✅ Container **Up** — `0.0.0.0:8000→8000/tcp` |
| **Status** | **PASS** |

---

### TC-OCR-002: OCR Document Extract — Inventory
| | |
|-|-|
| **Endpoint** | `POST /api/admin/ocr/extract` (proxy ke OCR service) |
| **Document Type** | `inventory` |
| **Fields Extracted** | Nama Barang, Kode Barang, Jumlah, Lokasi |
| **Expected** | Field berhasil diekstrak dari gambar/file dokumen |
| **Actual** | ✅ **PASS** — Teruji oleh tim |
| **Status** | **PASS** |

---

### TC-OCR-003: OCR Document Extract — Registrasi Pasien
| | |
|-|-|
| **Endpoint** | `POST /api/admin/ocr/extract` |
| **Document Type** | `registrasi-pasien` |
| **Fields Extracted** | Nama, NIK, Alamat, No. Telepon |
| **Expected** | Data pasien berhasil diekstrak dari KTP/form |
| **Actual** | ✅ **PASS** — Teruji oleh tim |
| **Status** | **PASS** |

---

## Notes
- OCR microservice berjalan terpisah di port 8000 (Python)
- Backend Go mem-proxy request ke OCR via `OCR_SERVICE_URL=http://ocr:8000`
- Endpoint public: `POST /api/ocr/extract`
- Endpoint admin (dengan auth): `POST /api/admin/ocr/extract`
- Bahasa OCR dikonfigurasi via `REC_LANG_TYPE=en`
