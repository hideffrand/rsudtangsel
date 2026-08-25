"""
Document Parser - RSU Tangsel Care (PaddleOCR Edition)
Memproses teks mentah hasil ekstraksi PaddleOCR menjadi field terstruktur (NIK, Nama Lengkap, Umur, JK, dll).
"""

import json
import re
from typing import List, Dict, Any

MAX_RULES = 20
MAX_PATTERNS_PER_RULE = 10
MAX_PATTERN_LEN = 500

def parse_field_config(raw_text: str, field_config: str) -> List[Dict[str, Any]]:
    """
    Parser berbasis konfigurasi JSON yang dikelola via web admin (ocr_document_types.fields).
    Format:
      [{"key": "Nama Lengkap", "required": true,
        "patterns": ["<regex dengan group(1)>", "<fallback>"],
        "transform": "digits" (opsional)}]
    """
    rules = json.loads(field_config)
    if not isinstance(rules, list):
        raise ValueError("field_config harus berupa array JSON")
    if len(rules) > MAX_RULES:
        raise ValueError(f"terlalu banyak field (maks {MAX_RULES})")

    fields: List[Dict[str, Any]] = []
    for rule in rules:
        if not isinstance(rule, dict) or not str(rule.get("key", "")).strip():
            raise ValueError("setiap rule butuh 'key'")
        patterns = rule.get("patterns") or []
        if not isinstance(patterns, list) or len(patterns) > MAX_PATTERNS_PER_RULE:
            raise ValueError(f"rule {rule['key']!r}: patterns tidak valid")
        compiled = []
        for p in patterns:
            if not isinstance(p, str) or not p.strip():
                raise ValueError(f"rule {rule['key']!r}: pattern kosong")
            if len(p) > MAX_PATTERN_LEN:
                raise ValueError(f"rule {rule['key']!r}: pattern terlalu panjang")
            try:
                compiled.append(re.compile(p, re.IGNORECASE))
            except re.error as exc:
                raise ValueError(f"rule {rule['key']!r}: regex tidak valid ({exc})")

        value = ""
        for pattern in compiled:
            match = pattern.search(raw_text)
            if match:
                value = (match.group(1) if match.groups() else match.group(0)).strip()
                break
        if value:
            value = value.rstrip(",.-")
            if rule.get("transform") == "digits":
                value = re.sub(r"[^\d+]", "", value)

        fields.append({
            "key": str(rule["key"]).strip(),
            "value": value,
            "confidence": 90.0 if value else 40.0,
            "is_required": bool(rule.get("required", False)),
        })
    return fields

def parse_document(raw_text: str, doc_type: str = "generic", blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Dispatcher parser berdasarkan tipe dokumen.
    """
    doc_type_clean = (doc_type or "generic").lower().strip()
    
    if "ktp" in doc_type_clean:
        return parse_ktp(raw_text, blocks)
    elif "bpjs" in doc_type_clean:
        return parse_bpjs(raw_text, blocks)
    elif "rujukan" in doc_type_clean or "surat" in doc_type_clean:
        return parse_surat_rujukan(raw_text, blocks)
    elif "resep" in doc_type_clean:
        return parse_resep_dokter(raw_text, blocks)
    elif "registrasi" in doc_type_clean or "pasien" in doc_type_clean:
        return parse_registrasi_pasien(raw_text, blocks)
    else:
        return parse_generic(raw_text, blocks)

def parse_registrasi_pasien(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Parser untuk Form Registrasi Pasien di atas kertas.
    Field: NIK, Nama Lengkap, Umur, Jenis Kelamin, Alamat, No. Telepon.
    """
    fields = []
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]

    # 1. NIK (16 digit angka)
    nik_val = ""
    nik_match = re.search(r'NIK\s*[:\-\s]+([0-9\s\-]{16,25})', raw_text, re.IGNORECASE)
    if nik_match:
        nik_val = re.sub(r'\D', '', nik_match.group(1))
    else:
        any_16 = re.search(r'\b(3[0-9]{15}|[0-9]{16})\b', re.sub(r'[\s\-]', '', raw_text))
        if any_16:
            nik_val = any_16.group(1)
        else:
            for line in lines:
                digits = re.sub(r'\D', '', line)
                if len(digits) == 16:
                    nik_val = digits
                    break

    fields.append({
        "key": "NIK",
        "value": nik_val,
        "confidence": 98.0 if nik_val else 40.0,
        "is_required": True,
    })

    # 2. Nama Lengkap
    nama_val = ""
    nama_match = re.search(
        r'Nama(?:\s+(?:Pasien|Lengkap))?(?:[ \t]*[:\-][ \t]*|[ \t]+)([A-Za-z\s\.\,\'\-]+)',
        raw_text, re.IGNORECASE
    )
    if nama_match:
        nama_val = nama_match.group(1).strip().rstrip(",.-")
    else:
        if lines:
            first_line = re.sub(r'^.*?[:\-]\s*', '', lines[0]).strip()
            if first_line and not re.search(r'\d{5,}', first_line):
                nama_val = first_line

    fields.append({
        "key": "Nama Lengkap",
        "value": nama_val,
        "confidence": 95.0 if nama_val else 50.0,
        "is_required": True,
    })

    # 3. Umur (angka tahun)
    umur_val = ""
    umur_match = re.search(r'(?:Umur|Usia)\s*[:\-]?\s*(\d{1,3})', raw_text, re.IGNORECASE)
    if umur_match:
        umur_val = umur_match.group(1)
    else:
        thn_match = re.search(r'(\d{1,3})\s*(?:tahun|thn|th)\b', raw_text, re.IGNORECASE)
        if thn_match:
            umur_val = thn_match.group(1)

    fields.append({
        "key": "Umur",
        "value": umur_val,
        "confidence": 90.0 if umur_val else 45.0,
        "is_required": False,
    })

    # 4. Jenis Kelamin (Laki-laki / Perempuan)
    jk_val = ""
    if re.search(r'Laki\s*[-–—]?\s*laki|Pria|\bL\b', raw_text, re.IGNORECASE):
        jk_val = "Laki-laki"
    elif re.search(r'Perempuan|Wanita|\bP\b', raw_text, re.IGNORECASE):
        jk_val = "Perempuan"

    fields.append({
        "key": "Jenis Kelamin",
        "value": jk_val,
        "confidence": 92.0 if jk_val else 45.0,
        "is_required": False,
    })

    # 5. Alamat
    alamat_val = ""
    alamat_match = re.search(r'Alamat\s*[:\-]\s*([^\n\r]+)', raw_text, re.IGNORECASE)
    if alamat_match:
        alamat_val = alamat_match.group(1).strip()

    fields.append({
        "key": "Alamat",
        "value": alamat_val,
        "confidence": 85.0 if alamat_val else 40.0,
        "is_required": False,
    })

    # 6. No. Telepon / HP
    telp_val = ""
    telp_match = re.search(
        r'(?:No\.?\s*)?(?:Telepon|Telp(?:on)?|HP|WA)?\s*[:\-]?\s*(\+?62[\d\s\-]{8,15}|08[\d\s\-]{8,15})',
        raw_text, re.IGNORECASE
    )
    if telp_match:
        telp_val = re.sub(r'[^\d+]', '', telp_match.group(1))

    fields.append({
        "key": "No. Telepon",
        "value": telp_val,
        "confidence": 90.0 if telp_val else 40.0,
        "is_required": False,
    })

    return fields

def parse_ktp(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    fields = []
    nik_match = re.search(r'(?:NIK)?\s*[:\-\s]*([0-9\s\-]{16,20})', raw_text, re.IGNORECASE)
    nik = re.sub(r'\D', '', nik_match.group(1)) if nik_match else ""
    fields.append({"key": "NIK", "value": nik, "confidence": 95.0 if nik else 40.0, "is_required": True})

    nama_match = re.search(r'Nama\s*[:\-]\s*([A-Za-z\s\.\,]+)', raw_text, re.IGNORECASE)
    nama = nama_match.group(1).strip() if nama_match else ""
    fields.append({"key": "Nama", "value": nama, "confidence": 92.0 if nama else 50.0, "is_required": True})

    return fields

def parse_bpjs(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    fields = []
    card_match = re.search(r'(?:No\.?\s*(?:Kartu|Peserta)?)\s*[:\-]?\s*(\d{13})', raw_text, re.IGNORECASE)
    card_no = card_match.group(1) if card_match else ""
    fields.append({"key": "No. Kartu BPJS", "value": card_no, "confidence": 95.0 if card_no else 40.0, "is_required": True})
    return fields

def parse_surat_rujukan(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    fields = []
    no_rujukan = re.search(r'(?:No\.?\s*Rujukan)\s*[:\-]?\s*([A-Za-z0-9\/\-]+)', raw_text, re.IGNORECASE)
    fields.append({"key": "No. Rujukan", "value": no_rujukan.group(1).strip() if no_rujukan else "", "confidence": 90.0 if no_rujukan else 40.0})
    return fields

def parse_resep_dokter(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    fields = []
    dokter_match = re.search(r'(?:dr\.|Dokter)\s*([A-Za-z\s\.\,]+)', raw_text, re.IGNORECASE)
    fields.append({"key": "Nama Dokter", "value": dokter_match.group(0).strip() if dokter_match else "", "confidence": 88.0 if dokter_match else 40.0})
    return fields

def parse_generic(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    return [{"key": f"Baris {i+1}", "value": line, "confidence": 90.0, "is_required": False} for i, line in enumerate(raw_text.split('\n')) if line.strip()]
