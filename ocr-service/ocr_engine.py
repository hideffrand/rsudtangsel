"""
OCR Engine Wrapper - RSU Tangsel Care
Menggunakan library CnOCR (https://github.com/breezedeus/cnocr)
Mendukung ekstraksi teks multi-baris, confidence score, dan posisi bounding box.
"""

import io
import os
import logging
from typing import List, Dict, Any
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr_engine")

_ocr_instance = None

def get_ocr_instance():
    """
    Lazy initialization untuk CnOCR instance agar tidak blocking saat startup.
    Model default dioptimalkan untuk teks alfabet Latin / angka (rec_lang_type='en' atau 'ch').
    """
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from cnocr import CnOcr
            rec_lang = os.getenv("REC_LANG_TYPE", "en") # 'en' optimal untuk teks Latin/Indonesia & Angka NIK
            logger.info(f"Menginisialisasi CnOCR dengan rec_lang_type='{rec_lang}'...")
            _ocr_instance = CnOcr(rec_lang_type=rec_lang)
            logger.info("CnOCR berhasil diinisialisasi.")
        except Exception as e:
            logger.error(f"Gagal menginisialisasi CnOCR: {e}. Mengaktifkan mode fallback.")
            _ocr_instance = False
    return _ocr_instance

def extract_text_from_image_bytes(image_bytes: bytes) -> Dict[str, Any]:
    """
    Menerima byte gambar (JPEG/PNG/WebP/dll), melakukan OCR menggunakan CnOCR,
    dan mengembalikan list blok teks beserta confidence score (0-100%).
    """
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Format gambar tidak valid: {e}")

    ocr = get_ocr_instance()
    
    # Jika cnocr terpasang dan siap digunakan
    if ocr is not None and ocr is not False:
        try:
            # CnOcr.ocr() menerima PIL Image atau path atau numpy array
            results = ocr.ocr(image)
            
            blocks: List[Dict[str, Any]] = []
            full_texts: List[str] = []
            total_score = 0.0

            for item in results:
                # CnOCR item format: {'text': '...', 'score': 0.985, 'position': [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]}
                text = item.get("text", "").strip()
                score = float(item.get("score", 0.0))
                # Konversi skor ke skala 0-100
                score_pct = round(score * 100, 2)
                position = item.get("position", [])

                if text:
                    full_texts.append(text)
                    total_score += score_pct
                    blocks.append({
                        "text": text,
                        "score": score_pct,
                        "position": position.tolist() if hasattr(position, "tolist") else position,
                    })

            avg_confidence = round(total_score / len(blocks), 2) if blocks else 0.0

            return {
                "raw_text": "\n".join(full_texts),
                "avg_confidence": avg_confidence,
                "blocks": blocks,
            }
        except Exception as e:
            logger.error(f"Error saat menjalankan CnOCR: {e}")
            raise e

    # Fallback jika model cnocr belum ter-load (misal environment lokal minimal)
    return {
        "raw_text": "Hasil OCR simulasi (CnOCR engine belum dimuat)",
        "avg_confidence": 85.0,
        "blocks": [
            {"text": "Simulasi Ekstraksi Teks", "score": 85.0, "position": []}
        ],
    }
