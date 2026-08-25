# Hybrid OCR Microservice (PaddleOCR + Llama3.2-Vision) — RSU Tangsel Care

Microservice Optical Character Recognition (OCR) hibrida yang dirancang khusus untuk membaca formulir registrasi pasien rumah sakit (tulisan tangan / cetak) secara cepat, akurat, dan hemat komputasi (CPU-only).

---

## 🏗️ Arsitektur Hibrida

1. **Langkah 1 (PaddleOCR Full Image Pass):**
   - Membaca seluruh dokumen menggunakan Baidu PaddleOCR (PP-OCRv3, CPU-optimized).
   - Menghasilkan teks per baris beserta *confidence score* dan koordinat *bounding box* (polygon).
2. **Langkah 2 (Field Parsing & Format Validation):**
   - Mengelompokkan teks ke dalam 5 field pasien utama: `nama_lengkap`, `nik`, `umur`, `jenis_kelamin`, `no_telp`.
   - Menjalankan aturan validasi format:
     - `nik`: Tepat 16 digit numerik.
     - `no_telp`: Format nomor telepon Indonesia (awalan `08` / `628`, 10-14 digit).
     - `umur`: Angka usia 1-120.
     - `jenis_kelamin`: Normalisasi ke `Laki-laki` / `Perempuan`.
     - `nama_lengkap`: Minimal 2 karakter.
   - Field dengan *confidence* $< 0.85$, bernilai kosong, atau format tidak valid ditandai `needs_review = true`.
3. **Langkah 3 (Selective Crop + Llama3.2-Vision Fallback):**
   - Hanya memotong (*crop*) area gambar dari field yang membutuhkan review dengan padding 10px.
   - Mengirim potongan gambar ke **Llama3.2-Vision** via Ollama lokal dengan *prompt* terfokus.
4. **Langkah 4 (JSON Response):**
   - Mengembalikan hasil gabungan terstruktur lengkap dengan sumber ekstrasi (`paddleocr` atau `llama_vision`).

---

## 🚀 Endpoint API

### 1. `POST /ocr/patient-form` (Utama)
- **Body:** `multipart/form-data` dengan field `image` (file gambar JPG/PNG/WebP/JFIF).
- **Response Format:**
```json
{
  "nama_lengkap": {"value": "Ahmad Fauzi", "confidence": 0.97, "source": "paddleocr"},
  "nik": {"value": "3674012304950001", "confidence": null, "source": "llama_vision"},
  "umur": {"value": "30", "confidence": 0.94, "source": "paddleocr"},
  "jenis_kelamin": {"value": "Laki-laki", "confidence": 0.98, "source": "paddleocr"},
  "no_telp": {"value": "081234567890", "confidence": 0.91, "source": "paddleocr"},
  "processing_time_ms": 1234
}
```

### 2. `POST /ocr/extract` (Legacy Adapter)
- Kompatibel dengan proxy Go server & web admin.

### 3. `GET /health`
- Health check service status.

---

## 🧪 Pengujian Batch
Jalankan skrip tes mandiri:
```bash
python tests/run_batch_test.py
```
Atau uji folder berisi gambar foto formulir:
```bash
python tests/run_batch_test.py --dir path/ke/folder_gambar
```
