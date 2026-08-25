# DevSecOps Plan — RSUD Tangsel Monorepo

> Prepared: August 2026 · Based on repository analysis at commit `75376f0`
> Main priority: **Trivy v0.74.0** (already installed at `/usr/local/bin/trivy`)

---

## 1. Current State Overview

### 1.1 Attack Surface Inventory

| Module               | Stack                                                    | Security Artifacts                           | Notes                                      |
| -------------------- | -------------------------------------------------------- | -------------------------------------------- | ------------------------------------------ |
| `server/`            | Go 1.25 (sqlx, JWT, bcrypt)                              | `Dockerfile`, `go.mod/go.sum`, `migrations/` | Multi-stage + non-root                    |
| `web/`               | Next.js 16.3.1, React 19, Tailwind v4                    | `Dockerfile`, `package-lock.json`            | Non-root ; auth proxy via httpOnly cookie |
| `ocr-service/`       | FastAPI + PaddleOCR/CnOCR (PyTorch)                      | `Dockerfile`, `requirements.txt`             | Runs as root, dependencies not pinned   |
| `mobile/`            | Expo SDK 57 (RN 0.86)                                    | `package.json` (lockfile not tracked?)       | Public client                              |
| `browser-extension/` | MV3, Next.js 14 static export                            | `manifest.json`, `src/background.js`         | Next 14.2.35 (outdated version)            |
| Infrastructure       | `docker-compose.yaml` (db/server/web/ocr), PostgreSQL 16 | `.env.example`                               | Weak default credentials                   |

The processed data includes **patient PII** (national ID numbers, names, ID/BPJS documents via OCR). Therefore, in addition to standard DevSecOps practices, the project must comply with **Indonesia's Personal Data Protection Law (UU PDP No. 27/2022)** and applicable healthcare standards/regulations.

### 1.2 Quick Findings from Repository Analysis

1. **No CI/CD is currently implemented** (`/github` is empty) → all verification is still performed manually.
2. **Stale binary committed to the repository:** `server/api` (8.8 MB) exists in Git history — remove it from tracking.
3. **Weak default credentials** in `docker-compose.yaml` / `.env.example`:

   * `ADMIN_PASSWORD=xxxxxx`
   * `POSTGRES_PASSWORD=xxxxxx`
   * `JWT_SECRET=please-change-me-in-production`
4. **`ocr-service/Dockerfile`** runs as **root**, the base image is not pinned by digest, and `requirements.txt` uses unbounded `>=` version ranges (supply-chain risk involving packages such as `paddlepaddle`, `opencv-python`, `ollama`, etc.).
5. `web/Dockerfile` copies the **entire `node_modules` directory** into the runtime image, increasing the CVE attack surface compared to using a standalone output.
6. There is currently no automated secret scanning, SCA gating, or container image scanning.
7. There is no tracked lockfile in `mobile/` and `browser-extension/`? **This must be verified** — lockfiles are required for reproducible builds.
8. Existing positive security controls:

   * Consistent response envelope
   * `auth` / `cors` / `rate_limit` / `audit` middleware under `server/internal/middleware/`
   * Admin sessions use httpOnly cookies
   * Web tokens are not stored in `localStorage`

---

## 2. Priority #1 — Trivy (Phase 0, This Week)

Trivy v0.74.0 is already installed. Trivy provides the four scanners required for the initial security baseline:

* `vuln` — dependency vulnerabilities / CVEs
* `misconfig` — Dockerfile, Terraform, Kubernetes, and configuration issues
* `secret` — leaked credentials and secrets
* `license` — dependency license scanning

### 2.1 Baseline Scan — Run Now (Local)

```bash
# 0) Update the vulnerability database
trivy image --download-db-only

# 1) Scan the entire monorepo
#    vuln + secret + misconfiguration
trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL . > trivy-report-fs.txt

# 2) Scan Dockerfiles and docker-compose configuration
trivy config --severity HIGH,CRITICAL .

# 3) Scan images used/built by Compose
docker compose -f docker-compose.yaml build   # if images do not exist yet

trivy image --severity HIGH,CRITICAL \
  rsudtangsel-server rsudtangsel-web rsudtangsel-ocr postgres:16-alpine
```

> **WSL note:** The first scan of the PyTorch-based `rsudtangsel-ocr` image may take a long time because the image is multi-GB. Run it once as a baseline and save the results.

### 2.2 Failure / Gating Policy

Set a realistic threshold so that the security gate does not immediately fail the entire pipeline:

```bash
# CI gate: fail if there are unresolved CRITICAL/HIGH findings
trivy fs --scanners vuln,secret,misconfig \
  --severity CRITICAL,HIGH \
  --ignore-unfixed \
  --exit-code 1 \
  --timeout 10m \
  .
```

Create `.trivyignore` at the repository root for findings that have already been triaged.

Each ignored finding should contain:

* CVE/GAV identifier
* Reason for ignoring
* Review date

Example:

```gitignore
# Example format — populate after the baseline scan
# CVE-2026-XXXXX, false positive in dev dependency, review 2026-09-30
```

**Triage policy:**

* CRITICAL → remediate or mitigate within ≤ 7 days
* HIGH → remediate or mitigate within ≤ 30 days
* MEDIUM → document and track

Every `.trivyignore` entry must have a review/expiration date.

### 2.3 Trivy Automation

#### (a) Local Pre-Commit Hook

A lightweight hook that scans only changed files for secrets and misconfigurations:

Save as `scripts/pre-commit-trivy.sh`, then configure:

```bash
git config core.hooksPath scripts/githooks
```

```bash
#!/usr/bin/env bash

# Pre-commit hook: block new secrets and misconfigurations
FILES=$(git diff --cached --name-only --diff-filter=ACM)

[ -z "$FILES" ] && exit 0

trivy fs \
  --scanners secret,misconfig \
  --exit-code 1 \
  --quiet \
  $FILES
```

#### (b) GitHub Actions

Phase 3 — create `.github/workflows/security.yml`:

```yaml
name: security

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 3 * * 1" # Weekly scan every Monday

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
        ctx: [server, web] # Add OCR after reducing its image size

    steps:
      - uses: actions/checkout@v4

      - run: docker build -t local/${{ matrix.ctx }}:${{ github.sha }} ${{ matrix.ctx }}

      - uses: aquasecurity/trivy-action@0.28.0
        with:
          image-ref: local/${{ matrix.ctx }}:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: "1"
```

> Pin GitHub Actions by commit SHA after Phase 4 for supply-chain hardening. The local Trivy CLI version (`0.74.0`) and `trivy-action` may differ slightly — standardize them if the security gate becomes strict.

---

## 3. Phased Roadmap

### Phase 0 — Cleanup + Trivy Baseline *(Week 1)*

* [ ] Run the Trivy baseline scan (§2.1), save the report, perform triage, and create `.trivyignore`.
* [ ] Remove `server/api` from Git tracking and add it to `server/.gitignore`:
  `git rm --cached server/api`
* [ ] Replace all default credentials in Compose with **mandatory environment variables without fallbacks**, e.g. `${JWT_SECRET:?must be set}`, or at minimum document the credential rotation process.
* [ ] Ensure `.env`, `*.pem`, and lockfile patterns are consistently configured in all module `.gitignore` files.
* [ ] Commit `package-lock.json` for `mobile/` and `browser-extension/` if they are currently missing.

### Phase 1 — Secret & Data Hygiene *(Week 2)*

* [ ] Rotate `JWT_SECRET`, PostgreSQL password, and admin credentials. Assume the default values are **already compromised** because they previously existed in repository files.
* [ ] Enable the pre-commit hook from §2.3(a); consider adding Gitleaks as a second CI scanner.
* [ ] Audit logging: ensure `audit.go` never logs complete national ID numbers or tokens. Apply masking/redaction.
* [ ] OCR: uploaded patient documents must not remain on disk after processing. Verify in-memory processing in `main.py`; if temporary files are used, add cleanup and encryption at rest.
* [ ] Data retention: define retention periods for booking/registration data and establish a purge procedure, such as `deleted_at` plus a cleanup job.

### Phase 2 — Container Hardening *(Weeks 3–4)*

* [ ] `ocr-service/Dockerfile`: add a non-root user, pin the base image by digest, e.g. `python:3.11-slim@sha256:...`, remove `build-essential` from the runtime stage using multi-stage builds, and replace deprecated `libgl1-mesa-glx` with `libgl1`.
* [ ] `requirements.txt`: pin exact versions using `==` and generate `requirements.lock` with `pip-compile` (`pip-tools`) or migrate to `uv`; use hash pinning (`--require-hashes`) where possible.
* [ ] `web/Dockerfile`: use Next.js `standalone` output so the runtime image does not include the entire `node_modules` directory.
* [ ] Production Compose: use `sslmode=require` for PostgreSQL instead of `disable`, restrict database ports so they are not exposed to the host, and add `read_only: true` + `cap_drop: [ALL]` to services where applicable.
* [ ] Re-scan all images with Trivy (§2.1, step 3) until HIGH/CRITICAL findings are resolved or explicitly ignored with documented justification.
* [ ] Review OCR rate limiting and the 15 MB upload limit; add file MIME-type validation.

### Phase 3 — CI/CD Pipeline *(Month 2)*

* [ ] Basic PR workflow per module:

  * `server`: `go build ./... && go vet ./...`
  * `web`: `npm run lint && npx tsc --noEmit`
  * `browser-extension`: `npx tsc --noEmit`
  * `mobile`: `npx tsc --noEmit && npx expo lint`
* [ ] Add `security.yml` (§2.3b) and upload SARIF results to the GitHub Security tab.
* [ ] Start writing minimal Go tests for critical services:

  * `auth_service`
  * `user_service` (hash/bcrypt path)
  * `ocr_document_type_service` (regex validation — prevent ReDoS from admin input)
* [ ] Build container images exclusively in CI, tagged with the Git SHA, rather than building them on developer machines. Push images to a private registry.
* [ ] Staging environment: use a separate Compose profile and anonymized seed data. **Never use real patient data in staging.**

### Phase 4 — Supply Chain & Compliance *(Months 2–3)*

* [ ] Configure Dependabot (`.github/dependabot.yml`) for npm ×3, Go modules, Docker, and GitHub Actions.
* [ ] Pin all GitHub Actions to commit SHAs.
* [ ] Run `govulncheck ./...` as the official Go vulnerability scanner alongside Trivy.
* [ ] Use `npm audit --omit=dev` as a secondary security signal.
* [ ] Consider image signing with Cosign and SBOM generation:
  `trivy image --format cyclonedx --output sbom.json <image>`
* [ ] UU PDP compliance checklist:

  * Legal basis for data processing
  * Data processing agreements
  * Data subject access/deletion rights
  * Breach notification within ≤ 3 × 24 hours
  * DPO / data controller records
* [ ] Backup & Disaster Recovery: schedule encrypted PostgreSQL dumps and perform monthly restore tests.
* [ ] Access review: identify production-access users, enable GitHub 2FA, and protect the `main` branch.

---

## 4. Success Metrics

| Metric                                                      | Target                           |
| ----------------------------------------------------------- | -------------------------------- |
| Mean time to remediate CRITICAL findings from Trivy reports | ≤ 7 days                         |
| Unmitigated CRITICAL/HIGH findings in production images     | 0                                |
| New secrets committed to `main`                             | 0 (blocked by hook/CI)           |
| Auth service test coverage                                  | ≥ 80%                            |
| Trivy scan frequency                                        | Every PR + weekly scheduled scan |
| SBOM per release                                            | Yes (CycloneDX)                  |

---

## 5. Quick Daily Commands

```bash
# Scan the repository
trivy fs --scanners vuln,secret,misconfig --severity HIGH,CRITICAL .

# Scan IaC and Dockerfiles
trivy config .

# Scan a container image
trivy image <image-name>

# Update the CVE database
trivy image --download-db-only

# Quick vulnerability scan
trivy fs --format table --scanners vuln .

# Generate an SBOM
trivy image --format cyclonedx --output sbom.json <image>
```
