import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("field_parser")

CONFIDENCE_THRESHOLD = 0.85

# Mapping to fix common OCR digit recognition confusions in numeric fields like NIK
NIK_DIGIT_MAP = str.maketrans({
    'F': '7', 'f': '7', 'T': '7', 't': '7',
    'L': '1', 'l': '1', 'I': '1', 'i': '1', '|': '1', '!': '1', '/': '1', '\\': '1',
    'O': '0', 'o': '0', 'D': '0', 'Q': '0',
    'Z': '2', 'z': '2',
    'S': '5', 's': '5',
    'B': '8',
    'b': '6', 'G': '6',
    'q': '9', 'g': '9'
})


def _clean_val(val: str) -> str:
    """Strips leading/trailing colons, dashes, and whitespace."""
    if not val:
        return ""
    return re.sub(r"^[\s:\-.,_|#]+|[\s:\-.,_|#]+$", "", val).strip()


def _normalize_nik(raw: str) -> str:
    """Fixes OCR character confusion and extracts clean NIK digits."""
    if not raw:
        return ""
    translated = raw.translate(NIK_DIGIT_MAP)
    digits = re.sub(r"\D", "", translated)
    return digits


def _get_bbox_metrics(bbox: List[List[int]]) -> Dict[str, float]:
    if not bbox or len(bbox) < 2:
        return {}
    xs = [pt[0] for pt in bbox]
    ys = [pt[1] for pt in bbox]
    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    return {
        "x_min": x_min, "x_max": x_max,
        "y_min": y_min, "y_max": y_max,
        "x_center": (x_min + x_max) / 2,
        "y_center": (y_min + y_max) / 2,
        "width": max(1, x_max - x_min),
        "height": max(1, y_max - y_min),
    }


def parse_patient_fields(
    lines: List[Dict[str, Any]],
    confidence_threshold: float = CONFIDENCE_THRESHOLD,
) -> Dict[str, Dict[str, Any]]:
    """
    Parses OCR lines into named patient form fields.
    """
    raw_full_text = "\n".join([ln["text"] for ln in lines])

    results: Dict[str, Dict[str, Any]] = {
        "nama_lengkap": {"value": "", "confidence": None, "bbox": [], "is_valid": False, "needs_review": True, "source": "paddleocr"},
        "nik": {"value": "", "confidence": None, "bbox": [], "is_valid": False, "needs_review": True, "source": "paddleocr"},
        "umur": {"value": "", "confidence": None, "bbox": [], "is_valid": False, "needs_review": True, "source": "paddleocr"},
        "jenis_kelamin": {"value": "", "confidence": None, "bbox": [], "is_valid": False, "needs_review": True, "source": "paddleocr"},
        "no_telp": {"value": "", "confidence": None, "bbox": [], "is_valid": False, "needs_review": True, "source": "paddleocr"},
        "alamat": {"value": "", "confidence": None, "bbox": [], "is_valid": False, "needs_review": True, "source": "paddleocr"},
    }

    # ─────────────────────────────────────────────────────────────────────────
    # PASS 1: Line-by-Line Fuzzy Header Analysis
    # ─────────────────────────────────────────────────────────────────────────
    for idx, line in enumerate(lines):
        text = line["text"].strip()
        conf = float(line.get("confidence", 0.0))
        bbox = line.get("bbox", [])

        # 1. NIK Detection (matches NIK, NIE, N1K, KTP, No. Identitas)
        if not results["nik"]["value"] and (re.search(r"\b(?:ni[k1elt!]|ktp|identitas)\b", text, re.IGNORECASE) or re.search(r"^ni[k1elt!]\s*:", text, re.IGNORECASE)):
            after_label = re.sub(r"^[^:]*:\s*", "", text).strip()
            digits = _normalize_nik(after_label if after_label != text else text)
            if digits:
                results["nik"] = {
                    "value": digits,
                    "confidence": conf,
                    "bbox": bbox,
                    "is_valid": len(digits) == 16,
                    "needs_review": len(digits) != 16 or conf < confidence_threshold,
                    "source": "paddleocr",
                }
                logger.info(f"Line {idx} NIK: '{digits}'")
                continue

        # 2. Nama Lengkap Detection (matches Nama, Narma, Name, Lengkap)
        if not results["nama_lengkap"]["value"] and (re.search(r"(?:n[a-z]{2,5}\s*lengkap|n[a-z]{2,5}\s*pasien|\bnama\b|\blengkap\b)", text, re.IGNORECASE) or re.search(r"^n[a-z]{2,5}\s*:", text, re.IGNORECASE)):
            after_label = re.sub(r"^[^:]*:\s*", "", text).strip()
            after_label = re.sub(r"^(?:lengkap|pasien)\s*[:\-.]?\s*", "", after_label, flags=re.IGNORECASE).strip()
            if after_label and len(after_label) >= 2 and not re.search(r"^\d+$", after_label):
                results["nama_lengkap"] = {
                    "value": after_label,
                    "confidence": conf,
                    "bbox": bbox,
                    "is_valid": True,
                    "needs_review": conf < confidence_threshold,
                    "source": "paddleocr",
                }
                logger.info(f"Line {idx} Nama: '{after_label}'")
                continue

        # 3. Jenis Kelamin Detection (matches Jenis kelamin, Kelamin, JK, Laki, Perempuan)
        if not results["jenis_kelamin"]["value"] and (re.search(r"(?:jenis\s*kelamin|kelamin|\bjk\b)", text, re.IGNORECASE) or re.search(r"(?:laki|pria|perempuan|wanita)", text, re.IGNORECASE)):
            jk_val = "Laki-laki" if re.search(r"(?:laki|pria|male|lal)", text, re.IGNORECASE) else "Perempuan"
            results["jenis_kelamin"] = {
                "value": jk_val,
                "confidence": conf,
                "bbox": bbox,
                "is_valid": True,
                "needs_review": False,
                "source": "paddleocr",
            }
            logger.info(f"Line {idx} JK: '{jk_val}'")
            continue

        # 4. No. Telepon Detection (matches No. telp, No. te1p, No. HP, No. WA, 08xx)
        if not results["no_telp"]["value"] and (re.search(r"(?:no\.?\s*te[l1]p|telepon|hp|wa|\b08\d)", text, re.IGNORECASE)):
            phone_digits = re.sub(r"[^\d+]", "", text)
            if phone_digits.startswith("62"):
                phone_digits = "0" + phone_digits[2:]
            phone_m = re.search(r"(08\d{8,12})", phone_digits)
            if phone_m:
                results["no_telp"] = {
                    "value": phone_m.group(1),
                    "confidence": conf,
                    "bbox": bbox,
                    "is_valid": True,
                    "needs_review": False,
                    "source": "paddleocr",
                }
                logger.info(f"Line {idx} No Telp: '{phone_m.group(1)}'")
                continue

        # 5. Umur Detection (matches Umur, Lr, Usia, xx tahun, xx+ahvn)
        if not results["umur"]["value"] and (re.search(r"(?:umur|usia|\blr\b|\+ahvn|tahun|thn)", text, re.IGNORECASE) and not re.search(r"08\d{8}", text)):
            age_m = re.search(r"(\d{1,3})", text)
            if age_m:
                age_val = age_m.group(1)
                results["umur"] = {
                    "value": age_val,
                    "confidence": conf,
                    "bbox": bbox,
                    "is_valid": True,
                    "needs_review": False,
                    "source": "paddleocr",
                }
                logger.info(f"Line {idx} Umur: '{age_val}'")
                continue

    # ─────────────────────────────────────────────────────────────────────────
    # PASS 2: Positional Fallback (Line 0=Nama, Line 1=NIK, Line 2=Umur, Line 3=JK, Line 4=Telp)
    # ─────────────────────────────────────────────────────────────────────────
    if len(lines) >= 5:
        # Check Line 0 for Nama
        if not results["nama_lengkap"]["value"]:
            txt = re.sub(r"^[^:]*:\s*", "", lines[0]["text"]).strip()
            if len(txt) >= 2:
                results["nama_lengkap"] = {
                    "value": txt, "confidence": lines[0]["confidence"], "bbox": lines[0]["bbox"],
                    "is_valid": True, "needs_review": False, "source": "paddleocr",
                }
        # Check Line 1 for NIK
        if not results["nik"]["value"]:
            txt = _normalize_nik(lines[1]["text"])
            if len(txt) >= 10:
                results["nik"] = {
                    "value": txt, "confidence": lines[1]["confidence"], "bbox": lines[1]["bbox"],
                    "is_valid": len(txt) == 16, "needs_review": len(txt) != 16, "source": "paddleocr",
                }
        # Check Line 2 for Umur
        if not results["umur"]["value"]:
            age_m = re.search(r"(\d{1,3})", lines[2]["text"])
            if age_m:
                results["umur"] = {
                    "value": age_m.group(1), "confidence": lines[2]["confidence"], "bbox": lines[2]["bbox"],
                    "is_valid": True, "needs_review": False, "source": "paddleocr",
                }
        # Check Line 3 for JK
        if not results["jenis_kelamin"]["value"]:
            jk_val = "Laki-laki" if re.search(r"laki|pria|lal", lines[3]["text"], re.I) else "Perempuan"
            results["jenis_kelamin"] = {
                "value": jk_val, "confidence": lines[3]["confidence"], "bbox": lines[3]["bbox"],
                "is_valid": True, "needs_review": False, "source": "paddleocr",
            }
        # Check Line 4 for Telp
        if not results["no_telp"]["value"]:
            phone_m = re.search(r"(08\d{8,12})", re.sub(r"\D", "", lines[4]["text"]))
            if phone_m:
                results["no_telp"] = {
                    "value": phone_m.group(1), "confidence": lines[4]["confidence"], "bbox": lines[4]["bbox"],
                    "is_valid": True, "needs_review": False, "source": "paddleocr",
                }

    # ─────────────────────────────────────────────────────────────────────────
    # PASS 3: Global Text Regex Scanning
    # ─────────────────────────────────────────────────────────────────────────
    if not results["nik"]["value"]:
        nik_match = re.search(r"(?:3[0-9]{15}|[0-9]{16})", raw_full_text.translate(NIK_DIGIT_MAP))
        if nik_match:
            results["nik"]["value"] = nik_match.group(0)
            results["nik"]["is_valid"] = True
            results["nik"]["needs_review"] = False

    if not results["no_telp"]["value"]:
        phone_match = re.search(r"(08\d{8,12})", raw_full_text.replace("-", "").replace(" ", ""))
        if phone_match:
            results["no_telp"]["value"] = phone_match.group(1)
            results["no_telp"]["is_valid"] = True
            results["no_telp"]["needs_review"] = False

    # Clean up results
    for k in results:
        v = str(results[k]["value"]).strip()
        v = re.sub(r"^[:\-\s.,]+|[:\-\s.,]+$", "", v).strip()
        results[k]["value"] = v

    return results
