-- ============================================================================
-- Migration: fix-get-periodos-volumen-downline
-- Description: Change get_periodos_volumen to show downline network volume
--              instead of personal purchases. Uses get_unilevel_downline to
--              aggregate PV/CV from the user's organization (downline only,
--              excludes self).
-- Supabase ref: elqonjnniophqdnwhtbo
-- ============================================================================

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
  WITH descendants AS (
    SELECT d.user_id
    FROM get_unilevel_downline(v_uid, 99) d
    WHERE d.user_id != v_uid  -- exclude self, show only downline
  )
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
       WHERE o.user_id IN (SELECT user_id FROM descendants)
       AND o.created_at BETWEEN p.start_date AND p.end_date
      ), 0
    )::numeric AS personal_pv,
    COALESCE(
      (SELECT SUM(oi.cv)
       FROM public.orders o
       JOIN public.order_items oi ON oi.order_id = o.id
       WHERE o.user_id IN (SELECT user_id FROM descendants)
       AND o.created_at BETWEEN p.start_date AND p.end_date
      ), 0
    )::numeric AS personal_cv,
    COALESCE(u.group_vg, 0)::numeric AS group_vg
  FROM public.periodos p
  LEFT JOIN public.users u ON u.id = v_uid
  ORDER BY p.period_year DESC, p.period_month DESC;
END;
$$;
