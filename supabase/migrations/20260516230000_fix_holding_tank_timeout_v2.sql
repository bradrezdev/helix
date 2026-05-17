-- Migration: fix holding tank timeout v2
-- Fix: SET statement_timeout = 300s
-- Fix: Save sponsor_ids BEFORE deleting from holding_tank
-- Fix: Recalc VG only for affected sponsors (not all users)

CREATE OR REPLACE FUNCTION public.place_all_from_holding_tank()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET statement_timeout TO '300s'
AS $function$
DECLARE
  v_count int;
  v_errors text[] := '{}';
  v_caller_id uuid;
  v_sponsor_ids uuid[];
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    NULL;
  ELSE
    IF NOT (SELECT is_admin FROM public.users WHERE id = v_caller_id) THEN
      RAISE EXCEPTION 'unauthorized';
    END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.holding_tank LIMIT 1) THEN
    RETURN jsonb_build_object('placed_count', 0, 'errors', '["holding tank is empty"]');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.holding_tank ht
    LEFT JOIN public.unilevel_tree ut ON ut.user_id = ht.sponsor_id
    WHERE ut.user_id IS NULL
  ) THEN
    RETURN jsonb_build_object(
      'placed_count', 0,
      'errors', '["one or more sponsors not found in unilevel_tree"]'
    );
  END IF;

  -- Save sponsor IDs BEFORE deleting (needed for recalc)
  SELECT ARRAY_AGG(DISTINCT ht.sponsor_id) INTO v_sponsor_ids
  FROM public.holding_tank ht;

  -- STEP 1-4: Place all members (set-based)
  WITH sponsor_paths AS (
    SELECT ht.member_id, ht.sponsor_id,
           ut.path AS sponsor_path,
           replace(ht.member_id::text, '-', '_') AS uuid_label
    FROM public.holding_tank ht
    JOIN public.unilevel_tree ut ON ut.user_id = ht.sponsor_id
  ),
  new_paths AS (
    SELECT member_id, sponsor_id,
           (sponsor_path::text || '.' || uuid_label)::ltree AS new_path
    FROM sponsor_paths
  )
  INSERT INTO public.unilevel_tree (user_id, path)
  SELECT np.member_id, np.new_path
  FROM new_paths np
  ON CONFLICT (user_id) DO UPDATE SET path = EXCLUDED.path;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.users u
  SET unilevel_parent_id = ht.sponsor_id, updated_at = now()
  FROM public.holding_tank ht
  WHERE u.id = ht.member_id;

  DELETE FROM public.holding_tank;

  -- STEP 5: Recalc VG only for affected sponsors
  IF v_sponsor_ids IS NOT NULL AND array_length(v_sponsor_ids, 1) > 0 THEN
    PERFORM public.recalc_group_vg(sid) FROM unnest(v_sponsor_ids) AS sid;
    PERFORM public.recalc_rank(sid) FROM unnest(v_sponsor_ids) AS sid;
  END IF;

  UPDATE public.holding_tank_reset_config
  SET executed = true, executed_at = now()
  WHERE executed = false AND reset_at <= now();

  RETURN jsonb_build_object('placed_count', v_count, 'errors', v_errors);
END;
$function$;
