-- Reverse of 20260823000000_merge_medical_packages.up.sql.
-- Splits medical_packages back into mcu_packages + diagnostic_services.

CREATE TABLE IF NOT EXISTS mcu_packages (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    price       BIGINT       NOT NULL,
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

CREATE TABLE IF NOT EXISTS diagnostic_services (
    id          SERIAL PRIMARY KEY,
    category    VARCHAR(20)  NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    price       BIGINT       NOT NULL,
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

INSERT INTO mcu_packages (id, name, description, price, is_active, created_at, updated_at)
SELECT id, name, description, price, is_active, created_at, updated_at
FROM medical_packages WHERE type = 'mcu' ORDER BY id;

SELECT setval(pg_get_serial_sequence('mcu_packages', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM medical_packages WHERE type = 'mcu') + 1, 1), false);

INSERT INTO mcu_package_items (package_id, name, description, position, created_at)
SELECT i.package_id, i.name, i.description, i.position, i.created_at
FROM medical_package_items i
JOIN medical_packages p ON p.id = i.package_id
WHERE p.type = 'mcu' ORDER BY i.id;

INSERT INTO diagnostic_services (id, category, name, description, price, is_active, created_at, updated_at)
SELECT id, type, name, description, price, is_active, created_at, updated_at
FROM medical_packages WHERE type IN ('lab', 'radiologi') ORDER BY id;

SELECT setval(pg_get_serial_sequence('diagnostic_services', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 0) FROM medical_packages WHERE type IN ('lab', 'radiologi')) + 1, 1), false);

INSERT INTO diagnostic_service_items (service_id, name, description, position, created_at)
SELECT i.package_id, i.name, i.description, i.position, i.created_at
FROM medical_package_items i
JOIN medical_packages p ON p.id = i.package_id
WHERE p.type IN ('lab', 'radiologi') ORDER BY i.id;

-- Restore the original FK on mcu_bookings.
ALTER TABLE mcu_bookings DROP CONSTRAINT IF EXISTS mcu_bookings_package_id_fkey;
ALTER TABLE mcu_bookings
    ADD CONSTRAINT mcu_bookings_package_id_fkey
    FOREIGN KEY (package_id) REFERENCES mcu_packages(id);

DROP TABLE IF EXISTS medical_package_items;
DROP TABLE IF EXISTS medical_packages;
