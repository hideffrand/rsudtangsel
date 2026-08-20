-- 20260819010000_add_diagnostic_services.up.sql
-- Catalog layanan diagnostik (Lab + Radiologi), struktur sama seperti mcu_packages.

CREATE TABLE IF NOT EXISTS diagnostic_services (
    id          SERIAL PRIMARY KEY,
    category    VARCHAR(20)  NOT NULL, -- 'lab' | 'radiologi'
    name        VARCHAR(150) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    price       BIGINT       NOT NULL, -- harga dalam Rupiah (IDR)
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diagnostic_service_items (
    id          SERIAL PRIMARY KEY,
    service_id  INTEGER      NOT NULL REFERENCES diagnostic_services(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    position    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_services_category ON diagnostic_services(category);
CREATE INDEX IF NOT EXISTS idx_diagnostic_service_items_service_id ON diagnostic_service_items(service_id);
