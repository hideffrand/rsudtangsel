# 🔍 OCR Microservice — RSU Tangsel Care

Microservice OCR berbasis **FastAPI** dan library **[CnOCR (Breezedeus)](https://github.com/breezedeus/cnocr)** untuk ekstraksi dokumen identitas dan medis (KTP, BPJS, Surat Rujukan, Resep Dokter).

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Langsung (Lokal Python)

Pastikan Python 3.8+ sudah terpasang di komputer:

```bash
cd ocr-service

# (Opsional) Buat virtual environment
python -m venv venv
# Aktifkan virtual environment:
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Jalankan server FastAPI
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Akses dokumentasi interaktif Swagger UI di: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 2. Menjalankan via Docker Compose

Dari folder utama `rsudtangsel`:
```bash
docker compose up -d ocr
```

---

## 📡 API Endpoints

### 1. Health Check
- **URL**: `GET /health`
- **Response**:
```json
{
  "status": "ok",
  "service": "rsudtangsel-ocr",
  "engine": "CnOCR (PyTorch)",
  "version": "1.0.0"
}
```

### 2. Ekstraksi OCR
- **URL**: `POST /ocr/extract`
- **Content-Type**: `multipart/form-data`
- **Body Parameter**:
  - `file`: File gambar (JPG / PNG / WebP)
  - `doc_type`: Tipe dokumen (`ktp`, `bpjs`, `rujukan`, `resep`, atau `generic`)
- **Response**:
```json
{
  "success": true,
  "doc_type": "ktp",
  "process_time_ms": 142.5,
  "avg_confidence": 91.5,
  "raw_text": "PROVINSI BANTEN KOTA TANGERANG SELATAN\nNIK : 3674011204890001\nNama : Budi Santoso...",
  "extracted_fields": [
    {
      "key": "NIK",
      "value": "3674011204890001",
      "confidence": 98.0,
      "is_required": true
    },
    {
      "key": "Nama",
      "value": "Budi Santoso",
      "confidence": 92.0,
      "is_required": true
    }
  ],
  "blocks": [...]
}
```

---

## 🛠️ Cara Menambah / Mengubah Aturan Dokumen

Buka file [`doc_parser.py`](file:///d:/Project%20Pribadi/rsudtangsel/ocr-service/doc_parser.py). Semua fungsi ekstraksi telah ditandai dengan komentar:

```python
# ==============================================================================
# [TODO: EKSTRAKSI KTP] — SESUAIKAN REGEX / FIELD KTP DI SINI
# ==============================================================================
def parse_ktp(raw_text: str, blocks: List[Dict[str, Any]] = None):
    ...
```

Anda cukup menambahkan atau mengubah regex dan daftar field sesuai format dokumen yang nanti disepakati tim medis/SIMRS.
