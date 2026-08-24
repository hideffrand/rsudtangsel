# OCR Microservice (Microsoft TrOCR Edition) - RSU Tangsel Care

Microservice pengenalan teks tulisan tangan (*Handwritten Text Recognition* / HTR) untuk formulir pendaftaran dan rekam medis pasien menggunakan **Microsoft TrOCR (`microsoft/trocr-base-handwritten`)**.

## 🚀 Fitur Utama
1. **Model Transformer Khusus Tulisan Tangan:** Menggunakan arsitektur Vision Transformer (ViT) encoder + RoBERTa decoder yang sangat akurat mengenali tulisan tangan (*handwriting*).
2. **OpenCV Line Segmentation:** Mendeteksi dan memotong baris teks formulir secara adaptif.
3. **Kompatibilitas Penuh:** Output JSON 100% kompatibel dengan ekstensi browser Webform Copilot dan backend Go RSUD Tangsel.

## 🛠️ Menjalankan Service

### 1. Install Dependensi
```bash
pip install -r requirements.txt
```

### 2. Jalankan Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> **Catatan:** Pada saat pertama kali dijalankan, model TrOCR (~1.3 GB) akan diunduh secara otomatis dari Hugging Face ke cache lokal Anda.
