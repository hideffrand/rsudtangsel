
---

# Rangkuman dan Penjelasan Temuan Utama 

---

##  **Satu Hal yang Harus Dipahami Dulu**

> **Raw severity ≠ prioritas.**  
> (Angka kerentanan tidak sama dengan tingkat bahaya di sistem nyata.)

Bayangkan kamu punya 100 "lubang" di kode, tapi 95-nya berada di bagian yang **tidak pernah digunakan** oleh aplikasi. Prioritas perbaikan harus berdasarkan **apa yang benar-benar bisa dieksploitasi** di produksi, bukan hanya jumlahnya.

---

## 🔴 **P0 — Blocker Produksi (Wajib Diperbaiki ≤ 7 Hari)**

Ini adalah masalah yang **harus diperbaiki sebelum aplikasi go-live**.

### 1. **Image OCR — Risiko #1**

**Fakta:**
- 15 CRITICAL + 110 HIGH vulnerabilities
- **Kenapa berbahaya?** Service ini memproses upload dokumen pasien (file yang tidak dikenal) melalui library seperti OpenCV dan Pillow.
- Ada celah **memory corruption** di `libglib2.0` dan `libxml2` — persis di jalur serangan OCR.
- Container berjalan sebagai **root** (hak akses penuh ke sistem).

**Analoginya:** Bayangkan kamu menerima file dari siapa saja, lalu membukanya di komputer yang memiliki akses penuh ke semua data. Jika ada yang mengirim file berbahaya, seluruh sistem bisa dikompromi.

**Cara Perbaiki:**
- **Multi-stage Dockerfile:** Pisahkan `build-essential` (alat build) dari image runtime. Alat build hanya diperlukan saat proses build, tidak perlu dibawa ke produksi.
- **Jalankan sebagai non-root:** Buat user khusus di container (bukan root).
- **Pin digest base image:** Gunakan hash spesifik untuk image base, agar versi selalu konsisten.
- **Rebuild mingguan:** Sebagian besar 15 CRITICAL akan hilang hanya dengan rebuild karena perbaikan sudah ada di repositori distribusi.

**Contoh Dockerfile yang benar (runtime stage):**
```dockerfile
# Stage build
FROM python:3.11-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*
# ... build aplikasi di sini

# Stage runtime
FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*  # ← WAJIB: library runtime tetap ada

RUN adduser --system --group appuser && chown -R appuser:appuser /app
USER appuser
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
CMD ["python", "app.py"]
```

> **Catatan:** `libgl1` menggantikan `libgl1-mesa-glx` yang sudah deprecated di Debian versi terbaru.

---

### 2. **Image Web — Inflasi Struktural**

**Fakta:**
- 1 CRITICAL + 20 HIGH vulnerabilities
- **Kenapa bukan prioritas #1?** Semua temuan npm (seperti `tar`, `minimatch`, `glob`, `cross-spawn`) ada di runtime **hanya karena Dockerfile menyalin seluruh `node_modules` utuh**.
- Tapi Next.js sebenarnya **tidak pernah memuat** library-library itu saat server berjalan. Mereka hanya untuk development.

**Analoginya:** Kamu bawa seluruh isi lemari (termasuk barang di gudang) ke dapur, meskipun hanya butuh pisau dan wajan.

**Cara Perbaiki:**
1. **Satu perubahan** pada konfigurasi Next.js:
```js
// next.config.ts
const nextConfig = {
  output: "standalone", // ← HANYA ini yang perlu diubah!
};
```
2. Dengan `output: "standalone"`, hanya file yang benar-benar diperlukan untuk produksi yang ikut ke image. **Satu perubahan ini menghapus seluruh CRITICAL + mayoritas HIGH** sekaligus.
3. **1 HIGH yang tersisa** adalah `libcrypto3` — paket OS Alpine. Ini hilang saat base image di-refresh, bukan melalui perubahan kode.

---

### 3. **Posture Compose Produksi — Kredensial Sudah "Terbakar"**

**Fakta:**
- Kredensial default (`JWT_SECRET`, `POSTGRES_USER`, `ADMIN_PASSWORD`) pernah masuk ke git history (sudah "bocor").
- Port database dipublish ke host (`5432:5432`).
- Tidak menggunakan `sslmode=require` untuk koneksi database.

**Cara Perbaiki:**
1. **Rotasi semua kredensial** yang pernah ter-commit:
```bash
# Generate secret baru
openssl rand -hex 32
```
2. **Gunakan `fail-closed`** — jika variabel environment tidak set, container tidak jalan:
```yaml
environment:
  JWT_SECRET: ${JWT_SECRET:?}  # ← '?' artinya wajib diisi
  ADMIN_PASSWORD: ${ADMIN_PASSWORD:?}
```
3. **Jangan publish port database** ke host:
```yaml
# ❌ Jangan
ports:
  - "5432:5432"

# ✅ Lakukan (internal saja)
# ports:
#   - "5432:5432"  # dihapus
```
4. **Gunakan `sslmode=require`** di DATABASE_URL:
```yaml
DATABASE_URL: postgres://user:pass@db:5432/db?sslmode=require
```

---

## 🟡 **P1 — Quick Win (Minggu Ini)**

### 1. **Update `x/crypto` di Go**
```bash
go get golang.org/x/crypto@latest && go mod tidy
```
**Waktu pengerjaan:** 5 menit. Langsung menghapus kerentanan di package `edwards25519`.

### 2. **Buat `.trivyignore` untuk Waiver**

**Perhatikan:** `trivyignore` tidak mendukung inline comment. Format yang benar:

```bash
# .trivyignore
# Waiver: GO-2026-5932 — openpgp package is not imported in our code
GO-2026-5932

# Waiver: image-size — used only at build time (metro bundler), not in production
CVE-2025-38743

# Waiver: uuid@7 — used only at build time (iOS Expo toolchain), not in production
GHSA-mwp6-8rvw-6f9w
```

**Catatan:** Ini adalah **waivers**, bukan *false positive*. Bedanya:
- **False positive:** Alat mendeteksi sesuatu yang sebenarnya tidak ada. Contoh: scanner salah membaca versi.
- **Waiver:** Kerentanan itu nyata ada, tapi kita evaluasi dan putuskan bahwa **tidak reachable** di konteks produksi (misalnya hanya dipakai saat build).

### 3. **Pin Digest PostgreSQL + Bump Berkala**

**Jangan terjebak!** Pin digest memang memberi konsistensi, tapi:

| Misunderstanding | Fakta |
|------------------|-------|
| ❌ Pin digest = fix otomatis | ✅ Pin digest membuat image tidak pernah berubah sampai digest-nya di-bump manual |
| ❌ Cukup pin sekali | ✅ Harus **bump berkala** (Dependabot bisa otomatisasi ini) |
| ❌ Konsistensi = aman | ✅ Konsistensi tanpa bump = vulnerability menumpuk diam-diam |

**Cara yang benar:**
1. Pin digest untuk base image.
2. **Bump secara berkala** (mingguan) atau gunakan Dependabot untuk update digest.
3. Setiap bump, rescan untuk memastikan tidak ada regresi.

```yaml
# compose.yaml
db:
  image: postgres:16-alpine@sha256:xxx  # pin digest
  # Dependabot akan bump ini secara otomatis saat ada update
```

---

## 🟢 **P2 — Hygiene Terjadwal (Tidak Blocking)**

### 1. **Next.js Extension 14→16**
Ada 8 HIGH vulnerabilities yang dilaporkan, tapi **tidak reachable** karena:
- Tidak ada Next.js server yang berjalan di ekstensi browser.
- Tidak menggunakan SSRF/middleware-bypass/Server-Action.
- Output: `"export" static` dari origin `chrome-extension://`.

**Keputusan:** Lakukan upgrade sebagai hygiene, bukan blocker. Prioritaskan setelah P0 dan P1 selesai.

### 2. **Dependabot + Gate CI**
- Aktifkan Dependabot untuk otomatis memberi tahu saat ada vulnerability baru.
- Buat gate di CI/CD: blocking hanya pada **CRITICAL baru** saja.
- Sertakan SBOM (Software Bill of Materials) di setiap rilis.

---

##  **Fakta Pembeda: Server Lebih Bersih dari Web/OCR**

> **`rsudtangsel-server` adalah benchmark internal.**
> - UNKNOWN = 1, **nol** vulnerabilities lainnya.
>
> Ini membuktikan bahwa dengan pendekatan yang benar:
> - Stack Go minimal
> - Multi-stage alpine
>
> **Image bisa sangat bersih.** Target: OCR dan Web menyusul ke standar ini.

---

##  **Checklist Sign-Off Produksi**

Sebelum aplikasi di-deploy ke produksi, pastikan semua checklist ini terpenuhi:

| No | Kriteria | Status |
|----|----------|--------|
| 1 | **0 CRITICAL** di semua image | ☐ |
| 2 | Container **non-root** | ☐ |
| 3 | **Tidak ada kredensial default** | ☐ |
| 4 | **DB tidak terekspos ke host** | ☐ |
| 5 | **2 minggu rescan otomatis hijau** (berturut-turut) | ☐ |

---

##  **Prioritas Kerja untuk Minggu Ini**

| No | Tugas | Tim | Deadline |
|----|-------|-----|----------|
| 1 | OCR → multi-stage + non-root | Backend | 7 hari |
| 2 | Web → `output: "standalone"` | Frontend | 7 hari |
| 3 | Rotasi semua kredensial | DevOps | 7 hari |
| 4 | `.trivyignore` yang benar | Backend | 2 hari |
| 5 | Pin digest + bump berkala | DevOps | 2 hari |

---

**Dengan mengikuti prioritas ini, aplikasi RSU Tangsel akan aman untuk produksi.** 
