-- Create RPC: get_sponsorship_network_size
-- Counts all descendants via sponsor_id recursively
-- Returns total_count (all descendants) and direct_count (level 1 only)

CREATE OR REPLACE FUNCTION public.get_sponsorship_network_size(p_user_id uuid)
RETURNS TABLE(
  total_count bigint,
  direct_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH RECURSIVE sponsorship_tree AS (
    -- Base: direct recruits
    SELECT
      u.id,
      u.user_id,
      1 AS depth
    FROM users u
    WHERE u.sponsor_id = (SELECT u2.user_id FROM users u2 WHERE u2.id = p_user_id)

    UNION ALL

    -- Recursive: their recruits
    SELECT
      u.id,
      u.user_id,
      st.depth + 1
    FROM users u
    INNER JOIN sponsorship_tree st ON u.sponsor_id = st.user_id
  )
  SELECT
    COUNT(*)::bigint AS total_count,
    COUNT(*) FILTER (WHERE depth = 1)::bigint AS direct_count
  FROM sponsorship_tree;
$$;
