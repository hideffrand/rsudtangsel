"""
Document Parser - RSU Tangsel Care
Memproses teks mentah hasil OCR menjadi field terstruktur (NIK, Nama, dll).
Dilengkapi penanda TODO agar mudah disesuaikan ketika format dokumen sudah ditentukan.
"""

import json
import re
from typing import List, Dict, Any

# Batas konfigurasi field (dipakai parse_configured) — mencegah konfigurasi
# liar dari admin dan memperkecil permukaan ReDoS.
MAX_RULES = 20
MAX_PATTERNS_PER_RULE = 10
MAX_PATTERN_LEN = 500


def parse_field_config(raw_text: str, field_config: str) -> List[Dict[str, Any]]:
    """
    Parser berbasis konfigurasi JSON yang dikelola via web admin
    (ocr_document_types.fields). Format:
      [{"key": "Nama Lengkap", "required": true,
        "patterns": ["<regex dengan group(1)>", "<fallback>"],
        "transform": "digits" (opsional)}]
    Pattern pertama yang cocok menang; regex dikompilasi case-insensitive.
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
        key_str = str(rule["key"]).strip()
        patterns = rule.get("patterns") or []
        if not isinstance(patterns, list) or len(patterns) > MAX_PATTERNS_PER_RULE:
            raise ValueError(f"rule {key_str!r}: patterns tidak valid")
        compiled = []
        for p in patterns:
            if not isinstance(p, str) or not p.strip():
                raise ValueError(f"rule {key_str!r}: pattern kosong")
            if len(p) > MAX_PATTERN_LEN:
                raise ValueError(f"rule {key_str!r}: pattern terlalu panjang")
            try:
                compiled.append(re.compile(p, re.IGNORECASE))
            except re.error as exc:
                raise ValueError(f"rule {key_str!r}: regex tidak valid ({exc})")

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
            "key": key_str,
            "value": value,
            "confidence": 92.0 if value else 40.0,
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


# ==============================================================================
# [EKSTRAKSI FORM REGISTRASI PASIEN] - formulir kertas pendaftaran pasien.
# Key hasil ekstraksi dipetakan ke atribut data-copilot di form admin web
# (web/app/admin/pasien): NIK, Nama Lengkap, Umur, Jenis Kelamin, Alamat, No. Telepon.
# ==============================================================================
def parse_registrasi_pasien(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Parser untuk Form Registrasi Pasien di atas kertas.
    Field: NIK, Nama Lengkap, Umur, Jenis Kelamin, Alamat, No. Telepon.
    """
    fields = []

    # 1. NIK
    nik_match = re.search(r'N[1iI]K\s*[:\-\s]+([0-9\s\-]{12,25})', raw_text, re.IGNORECASE) \
        or re.search(r'\b(3[0-9\s\-]{15,22})\b', raw_text)
    nik_val = re.sub(r'\D', '', nik_match.group(1)) if nik_match else ""
    fields.append({
        "key": "NIK",
        "value": nik_val,
        "confidence": 98.0 if nik_val else 40.0,
        "is_required": True,
    })

    # 2. Nama Lengkap
    nama_match = re.search(
        r'Nama(?:\s+(?:Pasien|Lengkap))?(?:[ \t]*[:\-][ \t]*|[ \t]+)([A-Za-z][^\n\r:]+)',
        raw_text, re.IGNORECASE)
    nama_val = nama_match.group(1).strip().rstrip(",.-") if nama_match else ""
    fields.append({
        "key": "Nama Lengkap",
        "value": nama_val,
        "confidence": 92.0 if nama_val else 50.0,
        "is_required": True,
    })

    # 3. Umur
    umur_match = re.search(r'(?:Umur|Usia)\s*[:\-]?\s*(\d{1,3})\s*(?:tahun|th|thn)?', raw_text, re.IGNORECASE) \
        or re.search(r'\b(\d{1,2})\s*(?:tahun|th|thn)\b', raw_text, re.IGNORECASE)
    umur_val = umur_match.group(1) if umur_match else ""
    fields.append({
        "key": "Umur",
        "value": umur_val,
        "confidence": 90.0 if umur_val else 45.0,
        "is_required": False,
    })

    # 4. Jenis Kelamin
    jk_match = re.search(r'(Laki\s*[-–—]?\s*laki|Perempuan|Pria|Wanita)', raw_text, re.IGNORECASE)
    jk_val = ""
    if jk_match:
        raw_jk = jk_match.group(1).lower()
        if "laki" in raw_jk or "pria" in raw_jk:
            jk_val = "Laki-laki"
        elif "perempuan" in raw_jk or "wanita" in raw_jk:
            jk_val = "Perempuan"
    fields.append({
        "key": "Jenis Kelamin",
        "value": jk_val,
        "confidence": 93.0 if jk_val else 45.0,
        "is_required": False,
    })

    # 5. Alamat
    alamat_match = re.search(r'Alamat(?:[ \t]*[:\-][ \t]*|[ \t]+)([^\n\r]+)', raw_text, re.IGNORECASE)
    alamat_val = alamat_match.group(1).strip().rstrip(",.-") if alamat_match else ""
    fields.append({
        "key": "Alamat",
        "value": alamat_val,
        "confidence": 80.0 if alamat_val else 40.0,
        "is_required": False,
    })

    # 6. No. Telepon
    telp_match = re.search(
        r'(?:No\.?\s*)?(?:Telepon|Telp(?:on)?|HP|WA)(?:[ \t]*[:\-][ \t]*|[ \t]+)(\+62[\d\s\-]{8,18}|08[\d\s\-]{8,18})',
        raw_text, re.IGNORECASE) \
        or re.search(r'\b(08[\d\s\-]{8,16}|\+628[\d\s\-]{7,16})\b', raw_text)
    telp_val = re.sub(r'\D', '', telp_match.group(1)) if telp_match else ""
    fields.append({
        "key": "No. Telepon",
        "value": telp_val,
        "confidence": 88.0 if telp_val else 40.0,
        "is_required": False,
    })

    return fields


# ==============================================================================
# [TODO: EKSTRAKSI KTP] - SESUAIKAN REGEX / FIELD KTP DI SINI
# ==============================================================================
def parse_ktp(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Parser untuk e-KTP Indonesia.
    Field yang diekstrak: NIK, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Alamat, Agama, Status Perkawinan, Pekerjaan.
    """
    fields = []
    
    # 1. Ekstrak NIK (16 digit angka)
    # TODO: Tambah/ubah pola regex jika diperlukan
    nik_match = re.search(r'\b(3[0-9]{15}|[0-9]{16})\b', raw_text)
    nik_val = nik_match.group(1) if nik_match else ""
    fields.append({
        "key": "NIK",
        "value": nik_val,
        "confidence": 98.0 if nik_val else 40.0,
        "is_required": True,
    })

    # 2. Ekstrak Nama
    # TODO: Sesuaikan keyword pencarian Nama
    nama_match = re.search(r'Nama\s*[:\s\-]\s*([A-Za-z\s\.\,\'\`]+)', raw_text, re.IGNORECASE)
    nama_val = nama_match.group(1).strip() if nama_match else ""
    fields.append({
        "key": "Nama",
        "value": nama_val,
        "confidence": 92.0 if nama_val else 50.0,
        "is_required": True,
    })

    # 3. Ekstrak Tanggal Lahir (YYYY-MM-DD atau DD-MM-YYYY)
    # TODO: Sesuaikan format tanggal lahir
    tgl_match = re.search(r'(\d{2}[-\/\s]\d{2}[-\/\s]\d{4})', raw_text)
    fields.append({
        "key": "Tanggal Lahir",
        "value": tgl_match.group(1) if tgl_match else "",
        "confidence": 85.0 if tgl_match else 45.0,
        "is_required": False,
    })

    # 4. Ekstrak Alamat
    # TODO: Tambahkan kata kunci alamat jika ada format khusus
    alamat_match = re.search(r'Alamat\s*[:\s\-]\s*([^\n\r]+)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Alamat",
        "value": alamat_match.group(1).strip() if alamat_match else "",
        "confidence": 78.0 if alamat_match else 40.0,
        "is_required": False,
    })

    # 5. Ekstrak Agama
    # TODO: Pilihan agama standar
    agama_match = re.search(r'(ISLAM|KRISTEN|KATOLIK|HINDU|BUDDHA|KONGHUCU)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Agama",
        "value": agama_match.group(1).upper() if agama_match else "",
        "confidence": 95.0 if agama_match else 50.0,
        "is_required": False,
    })

    return fields


# ==============================================================================
# [TODO: EKSTRAKSI KARTU BPJS] - SESUAIKAN REGEX / FIELD BPJS DI SINI
# ==============================================================================
def parse_bpjs(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Parser untuk Kartu BPJS Kesehatan / KIS.
    Field: No. Kartu BPJS (13 digit), Nama Peserta, NIK, Faskes Tingkat 1.
    """
    fields = []

    # 1. No. Kartu BPJS (biasanya 13 digit angka diawali 000)
    # TODO: Sesuaikan regex nomor kartu
    bpjs_match = re.search(r'\b(0[0-9]{12}|[0-9]{13})\b', raw_text)
    bpjs_val = bpjs_match.group(1) if bpjs_match else ""
    fields.append({
        "key": "No. Kartu BPJS",
        "value": bpjs_val,
        "confidence": 97.0 if bpjs_val else 40.0,
        "is_required": True,
    })

    # 2. Nama Peserta BPJS
    # TODO: Sesuaikan pencarian nama
    nama_match = re.search(r'(?:Nama|Peserta)\s*[:\s\-]\s*([A-Za-z\s\.\,\'\`]+)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Nama Peserta",
        "value": nama_match.group(1).strip() if nama_match else "",
        "confidence": 90.0 if nama_match else 50.0,
        "is_required": True,
    })

    # 3. Faskes Tingkat 1 / FKTP
    # TODO: Sesuaikan keyword Faskes / Puskesmas / Klinik
    faskes_match = re.search(r'(?:Faskes|FKTP|Puskesmas|Klinik)\s*[:\s\-]?\s*([A-Za-z0-9\s\.\,\-]+)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Faskes Tingkat 1",
        "value": faskes_match.group(1).strip() if faskes_match else "",
        "confidence": 80.0 if faskes_match else 40.0,
        "is_required": False,
    })

    return fields


# ==============================================================================
# [TODO: EKSTRAKSI SURAT RUJUKAN] - SESUAIKAN FIELD SURAT RUJUKAN DI SINI
# ==============================================================================
def parse_surat_rujukan(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Parser untuk Surat Rujukan FKTP (Puskesmas/Klinik) ke RSU Tangsel.
    Field: No. Rujukan, Poli Tujuan, Diagnosa Awal, Faskes Pengirim.
    """
    fields = []

    # 1. No. Rujukan (Kombinasi angka & huruf)
    # TODO: Sesuaikan format no rujukan
    no_rujukan = re.search(r'(?:No\.?\s*Rujukan|Nomor)\s*[:\s\-]\s*([A-Za-z0-9\-\/]+)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "No. Rujukan",
        "value": no_rujukan.group(1).strip() if no_rujukan else "",
        "confidence": 92.0 if no_rujukan else 45.0,
        "is_required": True,
    })

    # 2. Poli Tujuan / Spesialis
    # TODO: Tambah poli seperti Jantung, Penyakit Dalam, Anak, Mata, dll.
    poli_match = re.search(r'(?:Poli(?:klinik)?|Spesialis|Tujuan)\s*[:\s\-]?\s*([A-Za-z\s]+)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Poli Tujuan",
        "value": poli_match.group(1).strip() if poli_match else "",
        "confidence": 88.0 if poli_match else 50.0,
        "is_required": True,
    })

    # 3. Diagnosa Awal
    # TODO: Sesuaikan keyword diagnosa / keluhan
    diagnosa_match = re.search(r'(?:Diagnosa|Diagnosis)\s*[:\s\-]?\s*([A-Za-z0-9\s\.\,\-]+)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Diagnosa Awal",
        "value": diagnosa_match.group(1).strip() if diagnosa_match else "",
        "confidence": 80.0 if diagnosa_match else 40.0,
        "is_required": False,
    })

    return fields


# ==============================================================================
# [TODO: EKSTRAKSI RESEP DOKTER] - SESUAIKAN FIELD RESEP DI SINI
# ==============================================================================
def parse_resep_dokter(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Parser untuk Resep Obat / Catatan Medis.
    Field: Dokter Penulis, Nama Pasien, Daftar Obat (R/).
    """
    fields = []

    # 1. Nama Dokter
    # TODO: Sesuaikan regex gelar dr. / Sp.
    doc_match = re.search(r'(dr\.\s*[A-Za-z\s\.\,]+(?:Sp\.[A-Za-z]+)?)', raw_text, re.IGNORECASE)
    fields.append({
        "key": "Dokter Penulis",
        "value": doc_match.group(1).strip() if doc_match else "",
        "confidence": 85.0 if doc_match else 45.0,
        "is_required": False,
    })

    # 2. Resep / Obat (R/)
    # TODO: Ekstraksi obat & dosis
    fields.append({
        "key": "Catatan Resep",
        "value": raw_text[:200].replace("\n", " ") if raw_text else "",
        "confidence": 75.0,
        "is_required": False,
    })

    return fields


# ==============================================================================
# [TODO: EKSTRAKSI DOKUMEN GENERIK / LAINNYA]
# ==============================================================================
def parse_generic(raw_text: str, blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Fallback untuk dokumen apapun. Mengembalikan baris-baris teks utama.
    """
    fields = []
    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    
    for i, line in enumerate(lines[:10], start=1):
        fields.append({
            "key": f"Baris {i}",
            "value": line,
            "confidence": 85.0,
            "is_required": False,
        })
    
    if not fields:
        fields.append({
            "key": "Hasil Teks",
            "value": raw_text or "-",
            "confidence": 50.0,
            "is_required": False,
        })

    return fields
