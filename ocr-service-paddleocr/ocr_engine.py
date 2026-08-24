"""
PaddleOCR Engine Wrapper - RSU Tangsel Care
Menggunakan Baidu PaddleOCR v2 API dengan model PP-OCRv3 (stabil di Windows CPU).
Mendukung:
1. Text Detection (DBNet) + Text Recognition (SVTR/CRNN).
2. Koordinat Bounding Box posisi teks.
3. Multi-baris pengenalan teks dengan confidence score.

Catatan: Model PP-OCRv4/v6 menggunakan OneDNN fused_conv2d yang tidak kompatibel
di Windows CPU. PP-OCRv3 menggunakan operator standar yang universal.
"""

import io
import os
import logging
from typing import List, Dict, Any
import numpy as np
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paddleocr_engine")

_ocr_instance = None

def _patch_paddleocr_predictor():
    """
    Monkey-patch paddleocr's create_predictor untuk menghapus IR optimization passes
    yang menyebabkan fused_conv2d (OneDNN) di PaddlePaddle 3.x pada Windows CPU.

    Root cause:
    - PaddlePaddle 3.3.1 mengaktifkan IR optimization (switch_ir_optim=True)
    - IR optimizer otomatis fuse Conv2D → fused_conv2d via OneDNN passes
    - Di Windows, OneDNNContext tidak bisa menemukan kernel 'Filter' → NotFoundError
    - Solusi: hapus pass fusion di config SEBELUM predictor dibuat
    """
    try:
        from paddleocr.tools.infer import utility as _util
        _orig_create = _util.create_predictor

        def _patched_create_predictor(args, mode, logger=None):
            predictor, input_tensor, output_tensors, config = _orig_create(args, mode, logger)
            return predictor, input_tensor, output_tensors, config

        # Patch config creation sebelum create_predictor dipanggil
        # dengan meng-override inference.Config yang digunakan
        try:
            from paddle import inference as _inference
            _orig_config_cls = _inference.Config

            class _PatchedConfig(_orig_config_cls):
                def switch_ir_optim(self, x=True):
                    # Paksa matikan IR opt untuk menghindari OneDNN conv fusion
                    super().switch_ir_optim(False)
                    # Hapus semua known conv fusion passes
                    for pass_name in [
                        "conv_bn_fuse_pass",
                        "conv_eltwiseadd_bn_fuse_pass",
                        "conv_affine_channel_fuse_pass",
                        "conv_transpose_eltwiseadd_bn_fuse_pass",
                        "conv_elementwise_add_act_fuse_pass",
                        "mkldnn_conv_fc_fuse_pass",
                        "mkldnn_placement_pass",
                    ]:
                        try:
                            super().delete_pass(pass_name)
                        except Exception:
                            pass

            _inference.Config = _PatchedConfig
            logger.info("Patch PaddleOCR predictor config berhasil (IR opt OFF).")
        except Exception as patch_err:
            logger.warning(f"Tidak bisa patch inference.Config: {patch_err}")

    except Exception as e:
        logger.warning(f"Tidak bisa load paddleocr utility untuk patch: {e}")


def get_ocr_instance():
    """
    Lazy initialization PaddleOCR dengan monkey-patch untuk menghindari
    OneDNN fused_conv2d error di Windows + PaddlePaddle 3.x.
    """
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            lang = os.getenv("OCR_LANG", "en")

            # Terapkan patch SEBELUM membuat instance PaddleOCR
            _patch_paddleocr_predictor()

            logger.info(f"Menginisialisasi PaddleOCR PP-OCRv3 (lang='{lang}', IR-opt OFF)...")
            _ocr_instance = PaddleOCR(
                use_angle_cls=True,
                lang=lang,
                ocr_version="PP-OCRv3",
                enable_mkldnn=False,
                show_log=False,
            )
            logger.info("PaddleOCR PP-OCRv3 berhasil diinisialisasi.")
        except Exception as e:
            logger.error(f"Gagal menginisialisasi PaddleOCR: {e}")
            raise e
    return _ocr_instance


def extract_text_from_image_bytes(image_bytes: bytes) -> Dict[str, Any]:
    """
    Menerima byte gambar (JPEG/PNG/WebP/JFIF/BMP), melakukan OCR menggunakan PaddleOCR,
    dan mengembalikan list blok teks beserta confidence score (0-100%).
    """
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(pil_image)
    except Exception as e:
        raise ValueError(f"Format gambar tidak valid: {e}")

    ocr = get_ocr_instance()

    try:
        # Jalankan inferensi PaddleOCR v2 API
        # Format output: [ [ [box_coordinates, (text, confidence)], ... ] ]
        result = ocr.ocr(image_np, cls=True)

        blocks: List[Dict[str, Any]] = []
        full_texts: List[str] = []
        total_score = 0.0

        if result and len(result) > 0 and result[0] is not None:
            lines_data = result[0]
            # Urutkan baris dari atas ke bawah berdasarkan koordinat Y
            lines_data.sort(key=lambda item: item[0][0][1] if item and item[0] else 0)

            for item in lines_data:
                if not item or len(item) < 2:
                    continue

                box = item[0]        # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
                text_info = item[1]  # (text, score)

                text = str(text_info[0]).strip()
                score = float(text_info[1])
                score_pct = round(score * 100, 2)

                if text:
                    full_texts.append(text)
                    total_score += score_pct
                    blocks.append({
                        "text": text,
                        "score": score_pct,
                        "position": box if isinstance(box, list) else [],
                    })

        avg_confidence = round(total_score / len(blocks), 2) if blocks else 0.0
        raw_text = "\n".join(full_texts)

        return {
            "raw_text": raw_text,
            "avg_confidence": avg_confidence,
            "blocks": blocks,
        }

    except Exception as e:
        logger.error(f"Error saat mengeksekusi PaddleOCR: {e}")
        raise e
