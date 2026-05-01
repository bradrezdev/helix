-- ============================================================================
-- Migration: helix-comisiones-nivel
-- Description: RPCs get_comisiones_nivel + get_socios_nivel for comisiones-nivel dashboard
-- Supabase ref: elqonjnniophqdnwhtbo
-- SDD change: comisiones-nivel (T-CN-01, T-CN-02)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. RPC: get_comisiones_nivel — aggregated level totals
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_comisiones_nivel(
  p_user_id uuid DEFAULT NULL,
  p_month int DEFAULT NULL,
  p_year int DEFAULT NULL
)
RETURNS TABLE(
  level smallint,
  total_socios bigint,
  total_pv numeric,
  total_cv numeric,
  total_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
BEGIN
  SELECT auth.uid() INTO v_uid;
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_uid;

  IF v_is_admin AND p_user_id IS NOT NULL THEN
    v_uid := p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    c.level,
    COUNT(DISTINCT c.source_user_id)::bigint AS total_socios,
    COALESCE(SUM(u.personal_pv), 0)::numeric AS total_pv,
    COALESCE(SUM(u.personal_cv), 0)::numeric AS total_cv,
    COALESCE(SUM(c.amount), 0)::numeric AS total_amount
  FROM public.commissions c
  LEFT JOIN public.users u ON u.id = c.source_user_id
  WHERE c.user_id = v_uid
    AND c.level IS NOT NULL
    AND c.bono_type IN ('unilevel', 'infinito_unilevel')
    AND (p_month IS NULL OR c.period_month = p_month)
    AND (p_year IS NULL OR c.period_year = p_year)
  GROUP BY c.level
  ORDER BY c.level ASC;
END;
$$;

-- --------------------------------------------------------------------------
-- 2. RPC: get_socios_nivel — detail rows for a specific level
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_socios_nivel(
  p_user_id uuid DEFAULT NULL,
  p_level smallint DEFAULT NULL,
  p_month int DEFAULT NULL,
  p_year int DEFAULT NULL
)
RETURNS TABLE(
  source_user_id uuid,
  user_id int,
  name text,
  apellidos text,
  pv numeric,
  cv numeric,
  amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
BEGIN
  SELECT auth.uid() INTO v_uid;
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_uid;

  IF v_is_admin AND p_user_id IS NOT NULL THEN
    v_uid := p_user_id;
  END IF;

  RETURN QUERY
  SELECT
    c.source_user_id,
    u.user_id,
    u.name,
    u.apellidos,
    COALESCE(u.personal_pv, 0)::numeric AS pv,
    COALESCE(u.personal_cv, 0)::numeric AS cv,
    COALESCE(SUM(c.amount), 0)::numeric AS amount
  FROM public.commissions c
  JOIN public.users u ON u.id = c.source_user_id
  WHERE c.user_id = v_uid
    AND c.level = p_level
    AND c.bono_type IN ('unilevel', 'infinito_unilevel')
    AND (p_month IS NULL OR c.period_month = p_month)
    AND (p_year IS NULL OR c.period_year = p_year)
  GROUP BY c.source_user_id, u.user_id, u.name, u.apellidos, u.personal_pv, u.personal_cv
  ORDER BY u.name ASC;
END;
$$;
