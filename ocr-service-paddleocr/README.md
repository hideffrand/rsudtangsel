# OCR Microservice (Baidu PaddleOCR Edition) - RSU Tangsel Care

Microservice OCR berbasis **Baidu PaddleOCR** menggunakan model DBNet (Text Detection) dan SVTR/CRNN (Text Recognition).

## 🚀 Fitur Utama
1. **Deteksi dan Pengenalan Teks Cepat:** Sangat optimal untuk teks cetak maupun tulisan tangan Latin/Inggris dengan latensi rendah.
2. **Angle Direction Classifier:** Mampu mendeteksi dan mengoreksi orientasi teks yang miring / terbalik.
3. **Kompatibilitas Penuh:** Output JSON 100% kompatibel dengan Webform Copilot dan backend Go.

## 🛠️ Menjalankan Service

### 1. Install Dependensi
```bash
pip install -r requirements.txt
```

### 2. Jalankan Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
