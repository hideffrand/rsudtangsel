-- 20260817000000_add_mcu_bookings.up.sql
-- MCU Booking table for online Medical Check-Up registration.
-- lab_tests and radiology_tests are stored as PostgreSQL TEXT[] for simplicity.

CREATE TABLE IF NOT EXISTS mcu_bookings (
    id              SERIAL PRIMARY KEY,

    -- Link to the registered patients table (nullable: walk-in patients may not have an account)
    patient_id      INTEGER      NULL REFERENCES patients(id) ON DELETE SET NULL,

    -- The MCU package selected by the patient
    package_id      INTEGER      NOT NULL REFERENCES mcu_packages(id) ON DELETE RESTRICT,

    -- Scheduling
    booking_date    DATE         NOT NULL,
    booking_time    TIME         NOT NULL,

    -- Patient information (stored here for walk-in / unregistered patients)
    nik             VARCHAR(20)  NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    birth_date      DATE         NOT NULL,
    phone_number    VARCHAR(15)  NOT NULL,
    address         TEXT         NOT NULL DEFAULT '',

    -- Additional diagnostic services (stored as arrays for easy querying)
    lab_tests       TEXT[]       NOT NULL DEFAULT '{}',
    radiology_tests TEXT[]       NOT NULL DEFAULT '{}',

    -- Booking lifecycle status
    -- Values: pending | confirmed | completed | cancelled
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',

    -- Payment
    -- payment_status: unpaid | awaiting_confirmation | paid | cancelled
    total_price     BIGINT       NOT NULL,  -- price in IDR (Rupiah)
    payment_status  VARCHAR(30)  NOT NULL DEFAULT 'unpaid',
    payment_method  VARCHAR(20)  NOT NULL DEFAULT '', -- transfer | qris | cash | bpjs

    notes           TEXT         NOT NULL DEFAULT '',

    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mcu_bookings_patient_id   ON mcu_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_mcu_bookings_package_id   ON mcu_bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_mcu_bookings_status       ON mcu_bookings(status);
CREATE INDEX IF NOT EXISTS idx_mcu_bookings_booking_date ON mcu_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_mcu_bookings_nik          ON mcu_bookings(nik);
