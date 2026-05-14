-- Add socio_pendiente to membership_type enum
-- This represents a user who selected "Socio" at registration but hasn't paid yet
ALTER TYPE public.membership_type ADD VALUE IF NOT EXISTS 'socio_pendiente' BEFORE 'socio';
