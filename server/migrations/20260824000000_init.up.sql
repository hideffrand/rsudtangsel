-- ============================================================
-- Initial schema (squashed baseline of all prior migrations).
-- Final state: users/audit, patients/doctors/schedules/poli,
-- medical_packages (+items), medical_package_bookings,
-- ocr_document_types.
-- ============================================================

CREATE TABLE public.appointments (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    doctor_id integer NOT NULL,
    schedule_date date NOT NULL,
    "time" time without time zone NOT NULL,
    payment_type character varying(20) NOT NULL,
    queue_number character varying(10) NOT NULL,
    qr_code text,
    status character varying(20) DEFAULT 'waiting'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    ip_address character varying(50) DEFAULT ''::character varying NOT NULL,
    user_agent text DEFAULT ''::text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;

CREATE TABLE public.doctor_schedules (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    day_of_week character varying(10) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone,
    quota integer DEFAULT 20,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.doctor_schedules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.doctor_schedules_id_seq OWNED BY public.doctor_schedules.id;

CREATE TABLE public.doctors (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    specialty character varying(50) NOT NULL,
    license_number character varying(50),
    email character varying(100),
    phone_number character varying(15),
    bio text,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    poli_id integer
);

CREATE SEQUENCE public.doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.doctors_id_seq OWNED BY public.doctors.id;

CREATE TABLE public.medical_package_bookings (
    id integer NOT NULL,
    patient_id integer,
    package_id integer NOT NULL,
    booking_date date NOT NULL,
    booking_time time without time zone NOT NULL,
    nik character varying(20) NOT NULL,
    full_name character varying(100) NOT NULL,
    birth_date date NOT NULL,
    phone_number character varying(15) NOT NULL,
    address text DEFAULT ''::text NOT NULL,
    lab_tests text[] DEFAULT '{}'::text[] NOT NULL,
    radiology_tests text[] DEFAULT '{}'::text[] NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    total_price bigint NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    booking_number character varying(20)
);

CREATE SEQUENCE public.medical_package_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.medical_package_bookings_id_seq OWNED BY public.medical_package_bookings.id;

CREATE TABLE public.medical_package_items (
    id integer NOT NULL,
    package_id integer NOT NULL,
    name character varying(150) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.medical_package_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.medical_package_items_id_seq OWNED BY public.medical_package_items.id;

CREATE TABLE public.medical_packages (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    name character varying(150) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    price bigint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT medical_packages_type_check CHECK (((type)::text = ANY ((ARRAY['mcu'::character varying, 'lab'::character varying, 'radiologi'::character varying])::text[])))
);

CREATE SEQUENCE public.medical_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.medical_packages_id_seq OWNED BY public.medical_packages.id;

CREATE TABLE public.ocr_document_types (
    id text NOT NULL,
    name text NOT NULL,
    fields text DEFAULT ''::text NOT NULL
);

CREATE TABLE public.patients (
    id integer NOT NULL,
    nik character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    birth_date date NOT NULL,
    address text,
    phone_number character varying(15) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.id;

CREATE TABLE public.poliklinik (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.poliklinik_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.poliklinik_id_seq OWNED BY public.poliklinik.id;

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'staff'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login timestamp without time zone,
    last_login_ip character varying(45) DEFAULT ''::character varying NOT NULL,
    last_login_user_agent text DEFAULT ''::text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);

ALTER TABLE ONLY public.doctor_schedules ALTER COLUMN id SET DEFAULT nextval('public.doctor_schedules_id_seq'::regclass);

ALTER TABLE ONLY public.doctors ALTER COLUMN id SET DEFAULT nextval('public.doctors_id_seq'::regclass);

ALTER TABLE ONLY public.medical_package_bookings ALTER COLUMN id SET DEFAULT nextval('public.medical_package_bookings_id_seq'::regclass);

ALTER TABLE ONLY public.medical_package_items ALTER COLUMN id SET DEFAULT nextval('public.medical_package_items_id_seq'::regclass);

ALTER TABLE ONLY public.medical_packages ALTER COLUMN id SET DEFAULT nextval('public.medical_packages_id_seq'::regclass);

ALTER TABLE ONLY public.patients ALTER COLUMN id SET DEFAULT nextval('public.patients_id_seq'::regclass);

ALTER TABLE ONLY public.poliklinik ALTER COLUMN id SET DEFAULT nextval('public.poliklinik_id_seq'::regclass);

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_license_number_key UNIQUE (license_number);

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.medical_package_bookings
    ADD CONSTRAINT medical_package_bookings_booking_number_key UNIQUE (booking_number);

ALTER TABLE ONLY public.medical_package_bookings
    ADD CONSTRAINT medical_package_bookings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.medical_package_items
    ADD CONSTRAINT medical_package_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.medical_packages
    ADD CONSTRAINT medical_packages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ocr_document_types
    ADD CONSTRAINT ocr_document_types_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_nik_key UNIQUE (nik);

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.poliklinik
    ADD CONSTRAINT poliklinik_name_key UNIQUE (name);

ALTER TABLE ONLY public.poliklinik
    ADD CONSTRAINT poliklinik_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

CREATE INDEX idx_appointments_doctor_id ON public.appointments USING btree (doctor_id);

CREATE INDEX idx_appointments_schedule_date ON public.appointments USING btree (schedule_date);

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_doctor_schedules_doctor_id ON public.doctor_schedules USING btree (doctor_id);

CREATE INDEX idx_doctors_poli_id ON public.doctors USING btree (poli_id);

CREATE INDEX idx_medical_package_bookings_booking_date ON public.medical_package_bookings USING btree (booking_date);

CREATE INDEX idx_medical_package_bookings_nik ON public.medical_package_bookings USING btree (nik);

CREATE INDEX idx_medical_package_bookings_package_id ON public.medical_package_bookings USING btree (package_id);

CREATE INDEX idx_medical_package_bookings_patient_id ON public.medical_package_bookings USING btree (patient_id);

CREATE INDEX idx_medical_package_bookings_status ON public.medical_package_bookings USING btree (status);

CREATE INDEX idx_medical_package_items_package_id ON public.medical_package_items USING btree (package_id);

CREATE INDEX idx_medical_packages_type ON public.medical_packages USING btree (type);

CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens USING btree (token);

CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);

CREATE INDEX idx_users_username ON public.users USING btree (username);

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.doctor_schedules
    ADD CONSTRAINT doctor_schedules_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_poli_id_fkey FOREIGN KEY (poli_id) REFERENCES public.poliklinik(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.medical_package_bookings
    ADD CONSTRAINT medical_package_bookings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.medical_packages(id);

ALTER TABLE ONLY public.medical_package_bookings
    ADD CONSTRAINT medical_package_bookings_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.medical_package_items
    ADD CONSTRAINT medical_package_items_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.medical_packages(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
