-- Merge mcu_packages + diagnostic_services into a single catalog table
-- medical_packages with a `type` discriminator ('mcu' | 'lab' | 'radiologi').
-- Existing IDs are preserved so mcu_bookings.package_id FKs stay intact.

CREATE TABLE IF NOT EXISTS medical_packages (
    id          SERIAL PRIMARY KEY,
    type        VARCHAR(20)  NOT NULL, -- 'mcu' | 'lab' | 'radiologi'
    name        VARCHAR(150) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    price       BIGINT       NOT NULL, -- harga dalam Rupiah (IDR)
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medical_packages_type_check CHECK (type IN ('mcu', 'lab', 'radiologi'))
);

CREATE INDEX IF NOT EXISTS idx_medical_packages_type ON medical_packages(type);

CREATE TABLE IF NOT EXISTS medical_package_items (
    id          SERIAL PRIMARY KEY,
    package_id  INTEGER      NOT NULL REFERENCES medical_packages(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    position    INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medical_package_items_package_id ON medical_package_items(package_id);

-- Migrate MCU packages (IDs preserved exactly — mcu_bookings.package_id
-- references them with ON DELETE RESTRICT).
INSERT INTO medical_packages (id, type, name, description, price, is_active, created_at, updated_at)
SELECT id, 'mcu', name, description, price, is_active, created_at, updated_at
FROM mcu_packages ORDER BY id;

-- Advance the sequence past the highest preserved MCU id...
SELECT setval(pg_get_serial_sequence('medical_packages', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM medical_packages) + 1, 1), false);

-- ...then migrate lab/radiologi with freshly assigned IDs. The old tables use
-- independent sequences that collide with MCU ids, so IDs cannot be preserved;
-- nothing references diagnostic_services by FK, so remapping is safe.
INSERT INTO medical_packages (type, name, description, price, is_active, created_at, updated_at)
SELECT category, name, description, price, is_active, created_at, updated_at
FROM diagnostic_services ORDER BY id;

-- Migrate items from both old item tables.
INSERT INTO medical_package_items (package_id, name, description, position, created_at)
SELECT package_id, name, description, position, created_at
FROM mcu_package_items ORDER BY id;

-- Lab/radiologi items are remapped to the new package IDs via (type, name).
INSERT INTO medical_package_items (package_id, name, description, position, created_at)
SELECT mp.id, i.name, i.description, i.position, i.created_at
FROM diagnostic_service_items i
JOIN diagnostic_services ds ON ds.id = i.service_id
JOIN medical_packages mp ON mp.type = ds.category AND mp.name = ds.name
ORDER BY i.id;

-- Repoint mcu_bookings.package_id to the merged table.
ALTER TABLE mcu_bookings DROP CONSTRAINT IF EXISTS mcu_bookings_package_id_fkey;
ALTER TABLE mcu_bookings
    ADD CONSTRAINT mcu_bookings_package_id_fkey
    FOREIGN KEY (package_id) REFERENCES medical_packages(id);

DROP TABLE IF EXISTS mcu_package_items;
DROP TABLE IF EXISTS mcu_packages;
DROP TABLE IF EXISTS diagnostic_service_items;
DROP TABLE IF EXISTS diagnostic_services;
