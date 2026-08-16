-- 20260816150452_mcu_packages.up.sql
CREATE TABLE IF NOT EXISTS mcu_packages (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    price       BIGINT       NOT NULL, -- harga dalam Rupiah (IDR)
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcu_package_items (
    id          SERIAL PRIMARY KEY,
    package_id  INTEGER     NOT NULL REFERENCES mcu_packages(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    position    INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mcu_package_items_package_id ON mcu_package_items(package_id);
