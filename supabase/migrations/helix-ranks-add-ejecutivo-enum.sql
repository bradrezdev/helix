-- Add Ejecutivo to rank_type enum between Socio and Bronce
ALTER TYPE public.rank_type ADD VALUE IF NOT EXISTS 'Ejecutivo' AFTER 'Socio';
