-- ============================================================================
-- Migration: helix-historial-volumen
-- Description: periodos table + get_periodos_volumen RPC + seed + backfill
-- Supabase ref: elqonjnniophqdnwhtbo
-- SDD change: helix-historial-volumen (T-HV-01)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. CREATE periodos table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.periodos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL CHECK (period_year >= 2024),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(period_month, period_year)
);

-- Indexes for periodos lookups
CREATE INDEX IF NOT EXISTS idx_periodos_status ON periodos(status);
CREATE INDEX IF NOT EXISTS idx_periodos_year_month ON periodos(period_year, period_month);

-- Performance index for get_periodos_volumen RPC
CREATE INDEX IF NOT EXISTS idx_order_items_user_date ON order_items(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);

-- --------------------------------------------------------------------------
-- 2. ENABLE RLS + policies
-- --------------------------------------------------------------------------
ALTER TABLE public.periodos ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can SELECT
DROP POLICY IF EXISTS periodos_select_policy ON public.periodos;
CREATE POLICY periodos_select_policy ON public.periodos
  FOR SELECT TO authenticated USING (true);

-- --------------------------------------------------------------------------
-- 3. SEED current month as active period
-- --------------------------------------------------------------------------
INSERT INTO public.periodos (name, period_month, period_year, start_date, end_date, status)
VALUES (
  to_char(now(), 'FMMonth YYYY'),
  extract(month FROM now())::int,
  extract(year FROM now())::int,
  date_trunc('month', now())::date,
  (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date,
  'active'
) ON CONFLICT (period_month, period_year) DO NOTHING;

-- --------------------------------------------------------------------------
-- 4. RPC: get_periodos_volumen
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_periodos_volumen(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  period_id uuid,
  period_name text,
  period_month int,
  period_year int,
  start_date date,
  end_date date,
  status text,
  personal_pv numeric,
  personal_cv numeric,
  group_vg numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
BEGIN
  -- Auth: use p_user_id if admin, else use caller's id
  SELECT auth.uid() INTO v_uid;
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_uid;

  IF v_is_admin AND p_user_id IS NOT NULL THEN
    v_uid := p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.period_month,
    p.period_year,
    p.start_date,
    p.end_date,
    p.status,
    COALESCE(
      (SELECT SUM(oi.pv)
       FROM public.orders o
       JOIN public.order_items oi ON oi.order_id = o.id
       WHERE o.user_id = v_uid
       AND o.created_at BETWEEN p.start_date AND p.end_date
      ), 0
    )::numeric AS personal_pv,
    COALESCE(
      (SELECT SUM(oi.cv)
       FROM public.orders o
       JOIN public.order_items oi ON oi.order_id = o.id
       WHERE o.user_id = v_uid
       AND o.created_at BETWEEN p.start_date AND p.end_date
      ), 0
    )::numeric AS personal_cv,
    COALESCE(u.group_vg, 0)::numeric AS group_vg
  FROM public.periodos p
  LEFT JOIN public.users u ON u.id = v_uid
  ORDER BY p.period_year DESC, p.period_month DESC;
END;
$$;

-- --------------------------------------------------------------------------
-- 5. BACKFILL past periods from monthly_closure (if table exists)
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'monthly_closure'
  ) THEN
    INSERT INTO public.periodos (name, period_month, period_year, start_date, end_date, status, closed_at)
    SELECT
      to_char(make_date(mc.year, mc.month, 1), 'FMMonth YYYY'),
      mc.month,
      mc.year,
      make_date(mc.year, mc.month, 1)::date,
      (make_date(mc.year, mc.month, 1) + interval '1 month' - interval '1 day')::date,
      'closed',
      mc.completed_at
    FROM public.monthly_closure mc
    WHERE mc.status = 'completed'
    ON CONFLICT (period_month, period_year) DO NOTHING;
  END IF;
END $$;
