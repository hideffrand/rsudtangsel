-- 20260819000000_add_poliklinik.down.sql
DROP INDEX IF EXISTS idx_doctors_poli_id;
ALTER TABLE doctors DROP COLUMN IF EXISTS poli_id;
DROP TABLE IF EXISTS poliklinik;
