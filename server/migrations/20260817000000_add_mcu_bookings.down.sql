-- 20260817000000_add_mcu_bookings.down.sql
-- Rollback: drop MCU bookings table and indexes

DROP INDEX IF EXISTS idx_mcu_bookings_nik;
DROP INDEX IF EXISTS idx_mcu_bookings_booking_date;
DROP INDEX IF EXISTS idx_mcu_bookings_status;
DROP INDEX IF EXISTS idx_mcu_bookings_package_id;
DROP INDEX IF EXISTS idx_mcu_bookings_patient_id;

DROP TABLE IF EXISTS mcu_bookings;
