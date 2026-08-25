"""
Llama3.2-Vision Fallback Module - Phase 4 (v2)
Handles targeted cropping and VLM inference for low-confidence or invalid fields.

Model Priority:
1. llama3.2-vision (mllama architecture, requires Ollama >= 0.4.0)
2. llava:7b (LLaVA architecture, supported on Ollama < 0.4.0)
3. moondream (lightweight alternative, very fast on CPU)

Jika semua VLM gagal, field tetap menggunakan hasil PaddleOCR (graceful degradation).
"""

import io
import os
import re
import logging
from typing import List, Optional
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vision_fallback")

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# Model fallback chain: Moondream is primary (lightweight ~800MB, fast on CPU)
PREFERRED_MODEL = os.getenv("OLLAMA_MODEL", "moondream")
FALLBACK_MODELS = ["moondream", "llama3.2-vision", "llava:7b", "llava"]

# Cache: model mana yang sudah dikonfirmasi bekerja
_confirmed_working_model: Optional[str] = "moondream"


FIELD_PROMPTS = {
    "nik": (
        "This is a cropped image showing a handwritten Indonesian ID number (NIK). "
        "The NIK must be exactly 16 digits. "
        "Please read the digits carefully and output ONLY the 16 digit number. "
        "If you cannot read all 16 digits clearly, output as many digits as you can see. "
        "Output only digits, nothing else."
    ),
    "nama_lengkap": (
        "This is a cropped image showing a handwritten Indonesian patient name. "
        "Please read the name carefully and output ONLY the person's full name. "
        "Output only the name, nothing else."
    ),
    "umur": (
        "This is a cropped image showing a handwritten age number on a hospital form. "
        "Output ONLY the age as a number (e.g., 25, 40, 7). "
        "Do not include the word 'tahun' or 'years'. Output only the number."
    ),
    "jenis_kelamin": (
        "This is a cropped image showing a handwritten gender field on an Indonesian hospital form. "
        "The value is either male (Laki-laki) or female (Perempuan). "
        "Output ONLY 'Laki-laki' or 'Perempuan' based on what you see. Nothing else."
    ),
    "no_telp": (
        "This is a cropped image showing a handwritten Indonesian phone number. "
        "The number starts with 08 or 62. "
        "Output ONLY the phone number digits starting with 08. "
        "Do not include spaces or dashes. Output only digits."
    ),
}


def crop_region(
    image: Image.Image,
    bbox: List[List[int]],
    padding: int = 12,
) -> Optional[Image.Image]:
    """
    Crops a rectangular region from the original PIL Image using 4-point polygon.
    Adds padding margin to avoid tight crops on handwritten text.
    """
    if not bbox or len(bbox) < 4:
        return None

    try:
        xs = [pt[0] for pt in bbox if len(pt) >= 2]
        ys = [pt[1] for pt in bbox if len(pt) >= 2]

        if not xs or not ys:
            return None

        img_w, img_h = image.size
        x_min = max(0, min(xs) - padding)
        y_min = max(0, min(ys) - padding)
        x_max = min(img_w, max(xs) + padding)
        y_max = min(img_h, max(ys) + padding)

        if (x_max - x_min) < 15 or (y_max - y_min) < 10:
            return None

        return image.crop((x_min, y_min, x_max, y_max))
    except Exception as e:
        logger.warning(f"crop_region gagal: {e}")
        return None


def _get_available_model() -> Optional[str]:
    """
    Finds the first available/working Ollama VLM model from the priority list.
    Caches the result after first successful call.
    """
    global _confirmed_working_model

    if _confirmed_working_model is not None:
        return _confirmed_working_model

    try:
        import ollama
        client = ollama.Client(host=OLLAMA_HOST)

        # Get list of available models
        try:
            model_list = client.list()
            available_names = [m["name"] for m in model_list.get("models", [])]
        except Exception:
            available_names = []

        # Try preferred model first
        candidates = [PREFERRED_MODEL] + FALLBACK_MODELS
        for model in candidates:
            # Check if model name or base name is in available list
            base = model.split(":")[0]
            is_available = any(
                base in avail or model in avail
                for avail in available_names
            )
            if is_available or not available_names:
                logger.info(f"VLM model yang akan digunakan: '{model}'")
                _confirmed_working_model = model
                return model

        logger.warning("Tidak ada model VLM yang tersedia di Ollama. Lewati fallback.")
        return None
    except ImportError:
        logger.warning("Package 'ollama' belum terinstal.")
        return None
    except Exception as e:
        logger.warning(f"Tidak bisa mengecek model Ollama: {e}")
        return None


def read_with_llama_vision(
    cropped_image: Image.Image,
    field_name: str,
) -> Optional[str]:
    """
    Sends a cropped image to the best available local VLM via Ollama.
    Returns extracted text, or None if all models fail.
    """
    global _confirmed_working_model

    if cropped_image is None:
        return None

    prompt = FIELD_PROMPTS.get(
        field_name,
        f"This is a cropped image of handwritten text for the field '{field_name}'. "
        "Please read and output only the text value."
    )

    # Convert PIL Image to PNG bytes
    buffer = io.BytesIO()
    cropped_image.convert("RGB").save(buffer, format="PNG")
    image_bytes = buffer.getvalue()

    # Try models in priority order
    models_to_try = [PREFERRED_MODEL] + [m for m in FALLBACK_MODELS if m != PREFERRED_MODEL]
    if _confirmed_working_model and _confirmed_working_model not in models_to_try:
        models_to_try.insert(0, _confirmed_working_model)

    try:
        import ollama
        client = ollama.Client(host=OLLAMA_HOST)

        for model in models_to_try:
            try:
                logger.info(f"VLM fallback untuk '{field_name}' menggunakan model '{model}'...")
                response = client.chat(
                    model=model,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                            "images": [image_bytes],
                        }
                    ],
                    options={"temperature": 0.0, "num_ctx": 512, "num_thread": 4},
                )

                raw_output = response.get("message", {}).get("content", "").strip()
                if not raw_output:
                    continue

                # Bersihkan output dari kalimat percakapan model
                cleaned = re.sub(
                    r"^(?:here is|the text is|the (?:nik|name|age|number|value) is|result:|answer:|output:)\s*",
                    "", raw_output, flags=re.IGNORECASE
                )
                cleaned = re.sub(r"^[`'\"\s]+|[`'\"\s]+$", "", cleaned).strip()

                # Model ini berhasil — simpan untuk digunakan berikutnya
                _confirmed_working_model = model
                logger.info(f"VLM '{model}' selesai untuk '{field_name}'.")
                return cleaned if cleaned else None

            except Exception as model_err:
                err_msg = str(model_err)
                if "mllama" in err_msg or "unknown model architecture" in err_msg:
                    logger.warning(
                        f"Model '{model}' tidak kompatibel dengan versi Ollama ini "
                        f"(arsitektur 'mllama' perlu Ollama >= 0.4.0). "
                        f"Mencoba model alternatif..."
                    )
                elif "model not found" in err_msg.lower() or "404" in err_msg:
                    logger.debug(f"Model '{model}' tidak ditemukan, melewati...")
                else:
                    logger.warning(f"Model '{model}' error untuk '{field_name}': {model_err}")
                continue

        logger.warning(
            f"Semua model VLM gagal untuk '{field_name}'. "
            f"Gunakan perintah: ollama pull llava:7b  (atau update Ollama ke >= 0.4.0 untuk llama3.2-vision)"
        )
        return None

    except ImportError:
        logger.warning("Package 'ollama' belum terinstal (pip install ollama).")
        return None
    except Exception as e:
        logger.warning(f"Error koneksi ke Ollama untuk '{field_name}': {e}")
        return None
