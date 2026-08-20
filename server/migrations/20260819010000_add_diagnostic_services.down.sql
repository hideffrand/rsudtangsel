-- 20260819010000_add_diagnostic_services.down.sql
DROP INDEX IF EXISTS idx_diagnostic_service_items_service_id;
DROP INDEX IF EXISTS idx_diagnostic_services_category;
DROP TABLE IF EXISTS diagnostic_service_items;
DROP TABLE IF EXISTS diagnostic_services;
