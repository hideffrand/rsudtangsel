-- 20260821000000_add_ocr_document_types.up.sql
-- Master data jenis dokumen OCR (KTP, BPJS, rujukan, resep, dll).
-- id dipakai sebagai slug doc_type; name untuk label UI; fields adalah
-- daftar field ekstraksi (teks bebas / dipisah koma).

CREATE TABLE IF NOT EXISTS ocr_document_types (
    id     TEXT PRIMARY KEY,
    name   TEXT NOT NULL,
    fields TEXT NOT NULL DEFAULT ''
);
