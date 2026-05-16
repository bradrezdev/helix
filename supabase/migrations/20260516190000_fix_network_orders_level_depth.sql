-- Fix B: get_network_orders references d.level but get_unilevel_downline returns depth
-- Also: Get sponsor downline RPC for admin-assign-order (Fix C: sponsor_id tree)

-- Fix B: column name mismatch level → depth
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
    SELECT d.user_id, d.depth AS tree_level  -- FIX B: was d.level, should be d.depth
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

-- Fix C: RPC for getting sponsor downline by sponsor_id (numeric user_id)
-- Used by admin-assign-order edge function for 'network' mode
CREATE OR REPLACE FUNCTION public.get_sponsor_downline_ids(p_root_user_id int)
RETURNS TABLE(id uuid, user_id int, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH RECURSIVE sponsor_tree AS (
    -- Direct recruits of root
    SELECT u.id, u.user_id, u.name, 1 AS depth
    FROM users u
    WHERE u.sponsor_id = p_root_user_id

    UNION ALL

    -- Their recruits
    SELECT u.id, u.user_id, u.name, st.depth + 1
    FROM users u
    INNER JOIN sponsor_tree st ON u.sponsor_id = st.user_id
  )
  SELECT id, user_id, name
  FROM sponsor_tree
  ORDER BY depth, name;
$$;
