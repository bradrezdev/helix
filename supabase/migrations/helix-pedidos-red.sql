-- ============================================================================
-- Migration: helix-pedidos-red
-- Description: RPC get_network_orders for pedidos-red dashboard
-- Supabase ref: elqonjnniophqdnwhtbo
-- SDD change: pedidos-red (T-PR-01, T-PR-02)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. RPC: get_network_orders — paginated orders from unilevel downline
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_network_orders(
  p_root_id uuid DEFAULT NULL,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 20,
  p_status text DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE(
  order_id uuid,
  buyer_user_id int,
  buyer_name text,
  buyer_apellidos text,
  tree_level int,
  total_pv numeric,
  total_cv numeric,
  total_amount numeric,
  currency text,
  status text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean;
  v_offset int;
BEGIN
  SELECT auth.uid() INTO v_uid;
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = v_uid;

  -- Auth: caller must be root user OR admin
  IF NOT v_is_admin AND v_uid != p_root_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH descendants AS (
    SELECT d.user_id, d.level AS tree_level
    FROM get_unilevel_downline(p_root_id, 99) d
  ),
  filtered_orders AS (
    SELECT
      o.id AS order_id,
      u.user_id AS buyer_user_id,
      u.name AS buyer_name,
      u.apellidos AS buyer_apellidos,
      d.tree_level,
      o.total_pv,
      o.total_cv,
      o.total_amount,
      o.currency,
      o.status,
      o.created_at,
      COUNT(*) OVER() AS total_count
    FROM public.orders o
    JOIN descendants d ON d.user_id = o.user_id
    JOIN public.users u ON u.id = o.user_id
    WHERE (p_status IS NULL OR o.status = p_status)
      AND (p_date_from IS NULL OR o.created_at >= p_date_from)
      AND (p_date_to IS NULL OR o.created_at <= p_date_to)
  )
  SELECT *
  FROM filtered_orders
  ORDER BY created_at DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;
