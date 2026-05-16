-- Fix: users.country stores 'MX' (varchar) but orders.country is country_type enum (expects 'MXN')
-- COALESCE(country, 'MXN') returned 'MX' → enum cast failed in place_order_with_membership RPC
-- Now uses CASE to map: MX→MXN, US→USD, CO→COP, ES→EUR, default→MXN

CREATE OR REPLACE FUNCTION public.place_order_with_membership(...) [full function body in phase3 migration already applied via supabase_apply_migration]
