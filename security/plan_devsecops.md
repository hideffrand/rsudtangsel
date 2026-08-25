# Rencana DevSecOps — RSUD Tangsel Monorepo

> Disusun: Agustus 2026 · Basis: analisa repo per commit `75376f0`
> Prioritas utama: **Trivy v0.74.0** (sudah terpasang di `/usr/local/bin/trivy`)

---

## 1. Ringkasan Kondisi Saat Ini

### 1.1 Inventaris permukaan serangan

| Modul | Stack | Artefak keamanan | Catatan |
|---|---|---|---|
| `server/` | Go 1.25 (sqlx, JWT, bcrypt) | `Dockerfile`, `go.mod/go.sum`, `migrations/` | Multi-stage + non-root ✅ |
| `web/` | Next.js 16.3.1, React 19, Tailwind v4 | `Dockerfile`, `package-lock.json` | Non-root ✅; proxy auth via httpOnly cookie |
| `ocr-service/` | FastAPI + PaddleOCR/CnOCR (PyTorch) | `Dockerfile`, `requirements.txt` | ⚠️ root user, dep tak di-pin |
| `mobile/` | Expo SDK 57 (RN 0.86) | `package.json` (tanpa lockfile tracked?) | Client publik |
| `browser-extension/` | MV3, Next.js 14 static export | `manifest.json`, `src/background.js` | Next 14.2.35 (versi lama) |
| Infra | `docker-compose.yaml` (db/server/web/ocr), Postgres 16 | `.env.example` | Default kredensial lemah |

Data yang diproses = **PII pasien** (NIK, nama, dokumen KTP/BPJS via OCR) → selain praktik DevSecOps umum, wajib memperhatikan **UU PDP No. 27/2022** dan standar RS (Permenkes).

### 1.2 Temuan cepat (dari analisa repo)

1. **Tidak ada CI/CD sama sekali** (`/github` kosong) → semua verifikasi masih manual.
2. **Binary basi ter-commit**: `server/api` (8,8 MB) masuk ke git history — hapus dari tracking.
3. **Default kredensial lemah** di `docker-compose.yaml` / `.env.example`: `ADMIN_PASSWORD=admin123`, `POSTGRES_PASSWORD=rsudtangsel`, `JWT_SECRET=please-change-me-in-production`.
4. **`ocr-service/Dockerfile`**: berjalan sebagai **root**, base image tak di-pin digest, `requirements.txt` pakai range `>=` tanpa batas atas (risiko supply chain: `paddlepaddle`, `opencv-python`, `ollama`, dll).
5. `web/Dockerfile` menyalin **seluruh `node_modules`** ke runtime (permukaan CVE lebih besar daripada standalone output).
6. Tidak ada secret scanning, SCA gating, atau image scanning otomatis apa pun.
7. Tidak ada lockfile ter-commit di `mobile/` dan `browser-extension/`? (perlu diverifikasi — lockfile wajib agar build reproducible).
8. Hal positif yang sudah ada: envelope response konsisten, middleware `auth`/`cors`/`rate_limit`/`audit` di `server/internal/middleware/`, admin session httpOnly cookie (tidak ada token di localStorage web).

---

## 2. Prioritas #1 — Trivy (Fase 0, minggu ini)

Trivy v0.74.0 sudah terinstall. Trivy mencakup 4 scanner yang kita butuhkan sekaligus:
`vuln` (CVE dependensi), `misconfig` (Dockerfile/Terraform/K8s), `secret` (kredensial bocor), `license`.

### 2.1 Baseline scan — jalankan sekarang (lokal)

```bash
# 0) Update database vulnerability DB
trivy image --download-db-only

# 1) Scan SELURUH monorepo (vuln + secret + misconfig + license)
trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL . > trivy-report-fs.txt

# 2) Scan konfigurasi Dockerfile + docker-compose saja
trivy config --severity HIGH,CRITICAL .

# 3) Scan image yang dipakai/dibangun compose
docker compose -f docker-compose.yaml build   # jika belum ada image
trivy image --severity HIGH,CRITICAL \
  rsudtangsel-server rsudtangsel-web rsudtangsel-ocr postgres:16-alpine
```

Catatan WSL: pertama kali scan image PyTorch (`rsudtangsel-ocr`) akan lambat (image multi-GB). Jalankan sekali sebagai baseline, simpan hasilnya.

### 2.2 Kebijakan fail/gate

Tetapkan ambang yang realistis agar gate tidak langsung merah total:

```bash
# Gate CI: gagal bila ada CRITICAL/HIGH yang belum di-ignore
trivy fs --scanners vuln,secret,misconfig \
  --severity CRITICAL,HIGH \
  --ignore-unfixed \
  --exit-code 1 \
  --timeout 10m \
  .
```

Buat `.trivyignore` di root untuk temuan yang sudah ditriase (isi ID CVE/GAV + alasan + tanggal review):

```gitignore
# Contoh format — isi setelah baseline scan
# CVE-2026-XXXXX, false positive pada dev-dep, review 2026-09-30
```

Aturan triase: CRITICAL ≤ 7 hari diperbaiki/dimitigasi · HIGH ≤ 30 hari · MEDIUM dicatat. Setiap entri `.trivyignore` wajib punya tanggal kadaluarsa review.

### 2.3 Otomatisasi Trivy

**(a) Pre-commit lokal (hook ringan, hanya secret + misconfig pada file yang berubah):**

Simpan sebagai `scripts/pre-commit-trivy.sh` lalu `git config core.hooksPath scripts/githooks`:

```bash
#!/usr/bin/env bash
# Hook pre-commit: blokir secret & misconfig baru
FILES=$(git diff --cached --name-only --diff-filter=ACM)
[ -z "$FILES" ] && exit 0
trivy fs --scanners secret,misconfig --exit-code 1 --quiet $FILES
```

**(b) GitHub Actions (Fase 3 — file `.github/workflows/security.yml`):**

```yaml
name: security
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 3 * * 1"   # scan mingguan Senin
permissions:
  contents: read
  security-events: write
jobs:
  trivy-fs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          scan-type: fs
          scanners: vuln,secret,misconfig
          severity: CRITICAL,HIGH
          ignore-unfixed: true
          exit-code: "1"
          format: sarif
          output: trivy.sarif
      - uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy.sarif
  trivy-images:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        ctx: [server, web]   # ocr ikut setelah build-nya dirampingkan
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t local/${{ matrix.ctx }}:${{ github.sha }} ${{ matrix.ctx }}
      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: local/${{ matrix.ctx }}:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: "1"
```

> Pin action by SHA setelah Fase 4 (supply chain hardening). Trivy versi CLI lokal (0.74.0) dan `trivy-action` bisa sedikit berbeda — samakan bila gate mulai strict.

---

## 3. Roadmap Bertahap

### Fase 0 — Bersih-bersih + Trivy baseline *(minggu 1)*

- [ ] Jalankan baseline Trivy (§2.1), simpan laporan, triase → buat `.trivyignore`.
- [ ] Hapus `server/api` dari tracking & tambahkan ke `server/.gitignore`: `git rm --cached server/api`.
- [ ] Ganti semua default kredensial di compose menjadi **wajib dari env tanpa fallback** (`${JWT_SECRET:?wajib diset}`), atau minimal dokumentasikan rotasi.
- [ ] Pastikan `.env`, `*.pem`, lockfile konsisten di semua `.gitignore` modul.
- [ ] Commit lockfile (`package-lock.json`) untuk `mobile/` dan `browser-extension/` bila belum.

### Fase 1 — Secret & data hygiene *(minggu 2)*

- [ ] Rotasi: JWT_SECRET, password Postgres, kredensial admin (asumsikan nilai default **sudah bocor** karena pernah ada di file).
- [ ] Aktifkan hook pre-commit §2.3(a); pertimbangkan gitleaks di CI sebagai scanner kedua.
- [ ] Audit log: pastikan middleware `audit.go` tidak pernah mencatat NIK/token utuh (masking).
- [ ] OCR: dokumen pasien yang di-upload jangan tertinggal di disk — verifikasi pemrosesan in-memory di `main.py`; kalau ada temp-file, tambahkan pembersihan + enkripsi at-rest.
- [ ] Retensi: tentukan masa simpan data booking/registrasi + prosedur purge (kolom `deleted_at` / job pembersihan).

### Fase 2 — Hardening container *(minggu 3–4)*

- [ ] `ocr-service/Dockerfile`: tambah non-root user, pin base image (mis. `python:3.11-slim@sha256:...`), buang `build-essential` dari stage runtime (multi-stage), ganti `libgl1-mesa-glx` (deprecated) dengan `libgl1`.
- [ ] `requirements.txt`: pin versi eksak (`==`) + generate `requirements.lock` via `pip-compile` (pip-tools) atau migrasi ke `uv`; hash-pinning (`--require-hashes`) bila memungkinkan.
- [ ] `web/Dockerfile`: pakai output `standalone` Next.js supaya runtime tidak menyalin `node_modules` penuh.
- [ ] Compose produksi: `sslmode=require` untuk Postgres (jangan `disable`), batasi port db agar tidak expose ke host, tambah `read_only: true` + `cap_drop: [ALL]` per service yang memungkinkan.
- [ ] Re-scan semua image dengan Trivy (§2.1 langkah 3) hingga HIGH/CRITICAL bersih atau di-ignore dengan alasan.
- [ ] Rate limit & ukuran upload OCR (15 MB) direview; tambah validasi tipe MIME file.

### Fase 3 — Pipeline CI/CD *(bulan 2)*

- [ ] Workflow PR dasar per modul: `server`: `go build ./... && go vet ./...`; `web`: `npm run lint && npx tsc --noEmit`; `browser-extension`: `npx tsc --noEmit`; `mobile`: `npx tsc --noEmit && npx expo lint`.
- [ ] Pasang `security.yml` (§2.3b) + upload SARIF ke GitHub Security tab.
- [ ] Mulai tulis test Go minimal untuk service kritis: `auth_service`, `user_service` (hash/bcrypt path), `ocr_document_type_service` (validasi regex — cegah ReDoS dari input admin).
- [ ] Build image hanya dari CI (tag = git SHA), bukan dari laptop dev; push ke registry privat.
- [ ] Environment staging: compose profile terpisah + seed anonim (JANGAN seed data pasien asli ke staging).

### Fase 4 — Supply chain & compliance *(bulan 2–3)*

- [ ] Dependabot (`\.github/dependabot.yml`) untuk npm ×3, gomod, docker, github-actions.
- [ ] Pin semua GitHub Actions by commit SHA.
- [ ] `govulncheck ./...` (Go official) melengkapi Trivy; `npm audit --omit=dev` sebagai sinyal kedua.
- [ ] Pertimbangkan signing image (cosign) + SBOM: `trivy image --format cyclonedx --output sbom.json <image>` per release.
- [ ] UU PDP checklist: dasar pemrosesan data, perjanjian pemrosesan, hak subjek data (akses/hapus), notifikasi kebocoran ≤ 3×24 jam, DPO/kontroler record.
- [ ] Backup & DR: dump Postgres terenkripsi terjadwal; uji restore bulanan.
- [ ] Review akses: siapa yang punya akses prod, aktifkan 2FA GitHub, proteksi branch `main`.

---

## 4. Metrik Keberhasilan

| Metrik | Target |
|---|---|
| Waktu rata-rata perbaikan CRITICAL (dari laporan Trivy) | ≤ 7 hari |
| CRITICAL/HIGH tanpa mitigasi di image produksi | 0 |
| Secret baru masuk ke main | 0 (diblokir hook/CI) |
| Coverage test service auth | ≥ 80% |
| Scan rutin Trivy | tiap PR + mingguan scheduled |
| SBOM per rilis | ya (CycloneDX) |

## 5. Perintah Cepat Sehari-hari

```bash
trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL .   # scan repo
trivy config .                                                          # scan IaC/Dockerfile
trivy image <nama-image>                                                # scan image
trivy image --download-db-only                                          # update DB CVE
trivy fs --format table --scanners vuln .                               # lihat cepat
trivy image --format cyclonedx --output sbom.json <image>               # buat SBOM
```
