"""
Document Parser — RSU Tangsel Care
Memproses teks mentah hasil OCR menjadi field terstruktur (NIK, Nama, dll).
Dilengkapi penanda TODO agar mudah disesuaikan ketika format dokumen sudah ditentukan.
"""

import re
from typing import List, Dict, Any

def parse_document(raw_text: str, doc_type: str = "generic", blocks: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Dispatcher parser berdasarkan tipe dokumen.
    Jika doc_type tidak ditentukan atau 'generic', parser akan mencoba mendeteksi otomatis atau mengembalikan raw fields.
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
    else:
        return parse_generic(raw_text, blocks)


# ==============================================================================
# [TODO: EKSTRAKSI KTP] — SESUAIKAN REGEX / FIELD KTP DI SINI
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
# [TODO: EKSTRAKSI KARTU BPJS] — SESUAIKAN REGEX / FIELD BPJS DI SINI
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
# [TODO: EKSTRAKSI SURAT RUJUKAN] — SESUAIKAN FIELD SURAT RUJUKAN DI SINI
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
# [TODO: EKSTRAKSI RESEP DOKTER] — SESUAIKAN FIELD RESEP DI SINI
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
