-- 20260816083700_init.up.sql
-- Tabel untuk data pasien
CREATE TABLE IF NOT EXISTS pasien (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat TEXT,
    no_hp VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            

);

-- Tabel untuk pendaftaran online
CREATE TABLE IF NOT EXISTS pendaftaran (
    id SERIAL PRIMARY KEY,
    pasien_id INTEGER REFERENCES pasien(id),
    poli VARCHAR(50) NOT NULL,
    dokter VARCHAR(100) NOT NULL,
    tanggal DATE NOT NULL,
    jam TIME NOT NULL,
    jenis_pembayaran VARCHAR(20) NOT NULL, -- BPJS/Umum/Asuransi
    nomor_antrian VARCHAR(10) NOT NULL,
    qr_code TEXT,
    status VARCHAR(20) DEFAULT 'menunggu', -- menunggu/diproses/selesai/batal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk jadwal dokter (data master)
CREATE TABLE IF NOT EXISTS jadwal_dokter (
    id SERIAL PRIMARY KEY,
    poli VARCHAR(50) NOT NULL,
    dokter VARCHAR(100) NOT NULL,
    hari VARCHAR(10) NOT NULL, -- Senin, Selasa, ...
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    kuota INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query cepat
CREATE INDEX idx_pendaftaran_tanggal ON pendaftaran(tanggal);
CREATE INDEX idx_pendaftaran_status ON pendaftaran(status);
CREATE INDEX idx_pendaftaran_poli ON pendaftaran(poli);