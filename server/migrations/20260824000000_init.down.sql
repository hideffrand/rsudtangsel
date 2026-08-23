-- Reverse of 20260824000000_init.up.sql: drops the entire schema.
-- Order respects FK dependencies (children first).

DROP TABLE IF EXISTS public.medical_package_bookings;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.doctor_schedules;
DROP TABLE IF EXISTS public.medical_package_items;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP TABLE IF EXISTS public.doctors;
DROP TABLE IF EXISTS public.patients;
DROP TABLE IF EXISTS public.poliklinik;
DROP TABLE IF EXISTS public.medical_packages;
DROP TABLE IF EXISTS public.ocr_document_types;
DROP TABLE IF EXISTS public.users;
