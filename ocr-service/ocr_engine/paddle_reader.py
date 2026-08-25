"""
PaddleOCR Reader Module - Phase 2
Handles full-image baseline OCR using Baidu PaddleOCR (PP-OCRv3 on CPU).
Returns detected lines with text, normalized confidence (0.0 - 1.0), and bounding box polygon.
"""

import io
import os
import logging
from typing import List, Dict, Any, Union
import numpy as np
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paddle_reader")

_ocr_instance = None


def _patch_paddleocr_predictor():
    """
    Monkey-patch PaddlePaddle predictor to disable IR optimization passes
    that cause fused_conv2d (OneDNN) kernel NotFoundError on Windows CPU.
    """
    try:
        from paddle import inference as _inference
        _orig_config_cls = _inference.Config

        class _PatchedConfig(_orig_config_cls):
            def switch_ir_optim(self, x=True):
                super().switch_ir_optim(False)
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
        logger.debug("PaddleOCR predictor config successfully patched (IR opt OFF).")
    except Exception as e:
        logger.warning(f"Unable to patch Paddle inference config: {e}")


def get_paddle_ocr_instance():
    """
    Lazy initialization of PaddleOCR instance with CPU optimization.
    """
    global _ocr_instance
    if _ocr_instance is None:
        try:
            from paddleocr import PaddleOCR
            lang = os.getenv("OCR_LANG", "en")
            _patch_paddleocr_predictor()

            logger.info(f"Initializing PaddleOCR PP-OCRv3 (lang='{lang}', CPU mode)...")
            _ocr_instance = PaddleOCR(
                use_angle_cls=True,
                lang=lang,
                ocr_version="PP-OCRv3",
                enable_mkldnn=False,
                show_log=False,
            )
            logger.info("PaddleOCR PP-OCRv3 initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}")
            raise e
    return _ocr_instance


def run_paddle_ocr(image_input: Union[str, bytes, Image.Image]) -> List[Dict[str, Any]]:
    """
    Runs PaddleOCR on the full image.

    Args:
        image_input: Filepath string, raw image bytes, or PIL Image.

    Returns:
        List of dicts: [
            {
                "text": str,
                "confidence": float (0.0 to 1.0),
                "bbox": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]]
            },
            ...
        ]
    """
    if isinstance(image_input, str):
        pil_image = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, bytes):
        pil_image = Image.open(io.BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, Image.Image):
        pil_image = image_input.convert("RGB")
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    image_np = np.array(pil_image)
    ocr = get_paddle_ocr_instance()

    result = ocr.ocr(image_np, cls=True)

    lines: List[Dict[str, Any]] = []

    if result and len(result) > 0 and result[0] is not None:
        lines_data = result[0]
        # Sort lines top-to-bottom based on average Y coordinate
        lines_data.sort(key=lambda item: (item[0][0][1] + item[0][2][1]) / 2 if item and item[0] else 0)

        for item in lines_data:
            if not item or len(item) < 2:
                continue

            box = item[0]        # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            text_info = item[1]  # (text, confidence)

            text = str(text_info[0]).strip()
            confidence = round(float(text_info[1]), 4)

            if text:
                lines.append({
                    "text": text,
                    "confidence": confidence,
                    "bbox": [[int(pt[0]), int(pt[1])] for pt in box] if isinstance(box, list) else [],
                })

    return lines
