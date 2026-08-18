-- 20260816140429_init_schema.up.sql
-- Master data: doctors
CREATE TABLE IF NOT EXISTS doctors (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    specialty      VARCHAR(50)  NOT NULL,
    license_number VARCHAR(50)  UNIQUE,
    email          VARCHAR(100),
    phone_number   VARCHAR(15),
    bio            TEXT,
    status         VARCHAR(20)  DEFAULT 'active',
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Patient master data
CREATE TABLE IF NOT EXISTS patients (
    id           SERIAL PRIMARY KEY,
    nik          VARCHAR(20)  UNIQUE NOT NULL,
    name         VARCHAR(100) NOT NULL,
    birth_date   DATE         NOT NULL,
    address      TEXT,
    phone_number VARCHAR(15)  NOT NULL,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Online registration / appointments
CREATE TABLE IF NOT EXISTS appointments (
    id            SERIAL PRIMARY KEY,
    patient_id    INTEGER     NOT NULL REFERENCES patients(id),
    doctor_id     INTEGER     NOT NULL REFERENCES doctors(id),
    schedule_date DATE        NOT NULL,
    time          TIME        NOT NULL,
    payment_type  VARCHAR(20) NOT NULL, -- BPJS | Umum | Asuransi
    queue_number  VARCHAR(10) NOT NULL,
    qr_code       TEXT,
    status        VARCHAR(20) DEFAULT 'waiting', -- waiting|processing|done|cancelled
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Doctor schedules (foreign key ke master data doctors)
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id          SERIAL PRIMARY KEY,
    doctor_id   INTEGER     NOT NULL REFERENCES doctors(id),
    day_of_week VARCHAR(10) NOT NULL, -- Monday | Tuesday | ...
    start_time  TIME        NOT NULL,
    end_time    TIME,                -- NULL = buka sampai selesai ("Selesai")
    quota       INTEGER     DEFAULT 20,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_appointments_schedule_date ON appointments(schedule_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_id ON doctor_schedules(doctor_id);
