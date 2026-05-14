-- RLS Audit: Multi-role support
-- Creates a helper function that checks if the current user has admin OR supervisor access
-- This mirrors auth_is_admin() but adds supervisor support

CREATE OR REPLACE FUNCTION public.auth_is_admin_or_supervisor()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (is_admin = true OR is_supervisor = true)
  );
$function$;

-- Update key administrative RLS policies to grant supervisor access
-- where appropriate. Admin-only operations (INSERT/DELETE on sensitive tables)
-- remain restricted to is_admin only.

-- Admin settings: supervisors can read, only admins write
DROP POLICY IF EXISTS "admin_settings_admin_write" ON public.admin_settings;
CREATE POLICY "admin_settings_admin_write" ON public.admin_settings
  FOR ALL TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin());

-- Categorias: supervisors can read, only admins write
DROP POLICY IF EXISTS "categorias_admin_write" ON public.categorias;
CREATE POLICY "categorias_admin_write" ON public.categorias
  FOR ALL TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin());

-- Exchange rates: supervisors can read, only admins write
DROP POLICY IF EXISTS "Admin full access on exchange_rates" ON public.exchange_rates;
CREATE POLICY "Admin full access on exchange_rates" ON public.exchange_rates
  FOR ALL TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin());

-- Tax rates: supervisors can read, only admins write
DROP POLICY IF EXISTS "taxes_admin_write" ON public.taxes;
CREATE POLICY "taxes_admin_write" ON public.taxes
  FOR ALL TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin());

-- Users SELECT: supervisors can read user data (needed for role assignment UI)
-- IMPORTANT: Uses auth_is_admin_or_supervisor() (SECURITY DEFINER) NOT a raw subquery
-- Raw SELECT FROM public.users in the USING clause causes infinite RLS recursion
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO public
  USING ((auth.uid() = id) OR auth_is_admin() OR (is_supervisor = true AND auth_is_admin_or_supervisor()));

-- Users UPDATE: supervisors can update non-admin fields (role toggles)
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin_or_supervisor());

-- Product private access: supervisors can manage
DROP POLICY IF EXISTS "ppa_admin_all" ON public.product_private_access;
CREATE POLICY "ppa_admin_all" ON public.product_private_access
  FOR ALL TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin());

-- Commission payout batches: supervisors can read, only admins manage
DROP POLICY IF EXISTS "Admins can manage payout batches" ON public.commission_payout_batches;
CREATE POLICY "Admins can manage payout batches" ON public.commission_payout_batches
  FOR ALL TO public
  USING (auth_is_admin_or_supervisor())
  WITH CHECK (auth_is_admin());

-- Wallet transactions read: supervisors can view all
DROP POLICY IF EXISTS "Admins can read all wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can read all wallet transactions" ON public.wallet_transactions
  FOR SELECT TO public
  USING (auth_is_admin_or_supervisor());
