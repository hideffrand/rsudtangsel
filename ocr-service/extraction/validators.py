"""
Field Validation Rules - Phase 3
Implements format validation rules per field:
- nik: exactly 16 digits after stripping non-digit characters.
- no_telp: Indonesian phone pattern (starts with 08 or 628, 10-14 digits).
- umur: valid numeric age (1-120), handles "tahun" / "thn" suffixes.
- jenis_kelamin: normalizes to 'Laki-laki' or 'Perempuan'.
- nama_lengkap: valid non-empty string, min 2 characters.
"""

import re
from typing import Tuple


def validate_nik(value: str) -> Tuple[bool, str]:
    """
    Validates Indonesian NIK (Nomor Induk Kependudukan).
    Must be exactly 16 numeric digits.
    """
    if not value:
        return False, ""
    cleaned = re.sub(r"\D", "", value)
    if len(cleaned) == 16:
        return True, cleaned
    return False, cleaned


def validate_no_telp(value: str) -> Tuple[bool, str]:
    """
    Validates Indonesian phone number.
    Must start with 08 or 628/+628 and have 10-14 digits.
    """
    if not value:
        return False, ""
    cleaned = re.sub(r"[^\d+]", "", value)
    if cleaned.startswith("+62"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("62"):
        cleaned = "0" + cleaned[2:]

    digits = re.sub(r"\D", "", cleaned)
    if digits.startswith("08") and 10 <= len(digits) <= 14:
        return True, digits
    return False, digits


def validate_umur(value: str) -> Tuple[bool, str]:
    """
    Validates age (Umur).
    Extracts number 1-120, strips 'tahun' or 'thn'.
    """
    if not value:
        return False, ""
    match = re.search(r"\b(\d{1,3})\b", value)
    if match:
        age_num = int(match.group(1))
        if 1 <= age_num <= 120:
            return True, str(age_num)
    return False, value.strip()


def validate_jenis_kelamin(value: str) -> Tuple[bool, str]:
    """
    Validates and normalizes gender (Jenis Kelamin).
    Output: 'Laki-laki' or 'Perempuan'.
    """
    if not value:
        return False, ""
    val_lower = value.lower().strip()
    if any(k in val_lower for k in ["laki", "pria", "male", "^l$"]):
        return True, "Laki-laki"
    if any(k in val_lower for k in ["perempuan", "wanita", "female", "^p$"]):
        return True, "Perempuan"
    return False, value.strip()


def validate_nama_lengkap(value: str) -> Tuple[bool, str]:
    """
    Validates patient full name.
    Must be at least 2 characters, ignoring trailing colons or separators.
    """
    if not value:
        return False, ""
    cleaned = re.sub(r"^[:\-\s]+|[:\-\s]+$", "", value).strip()
    if len(cleaned) >= 2:
        return True, cleaned
    return False, cleaned


def validate_field(field_name: str, value: str) -> Tuple[bool, str]:
    """
    Dispatches validation based on field name.
    Returns (is_valid: bool, cleaned_value: str).
    """
    key = field_name.lower().strip()
    if "nik" in key or "ktp" in key:
        return validate_nik(value)
    elif "telp" in key or "phone" in key or "hp" in key or "wa" in key:
        return validate_no_telp(value)
    elif "umur" in key or "usia" in key or "age" in key:
        return validate_umur(value)
    elif "kelamin" in key or "gender" in key or "sex" in key:
        return validate_jenis_kelamin(value)
    elif "nama" in key or "name" in key:
        return validate_nama_lengkap(value)
    return bool(value and len(value.strip()) > 0), value.strip()
