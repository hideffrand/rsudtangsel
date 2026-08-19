-- 20260819000000_add_poliklinik.up.sql
-- Master data poliklinik (poli) + relasi doctors.poli_id.

CREATE TABLE IF NOT EXISTS poliklinik (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS poli_id INTEGER REFERENCES poliklinik(id) ON DELETE SET NULL;

-- Backfill: buat baris poliklinik dari specialty dokter yang sudah ada.
INSERT INTO poliklinik (name)
SELECT DISTINCT specialty FROM doctors WHERE specialty IS NOT NULL AND specialty <> ''
ON CONFLICT (name) DO NOTHING;

-- Sambungkan poli_id dokter ke poliklinik berdasarkan nama specialty.
UPDATE doctors d
SET poli_id = p.id
FROM poliklinik p
WHERE d.poli_id IS NULL AND d.specialty = p.name;

CREATE INDEX IF NOT EXISTS idx_doctors_poli_id ON doctors(poli_id);
