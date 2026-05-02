-- Fix: SECURITY DEFINER en get_unilevel_downline
-- Evita infinite recursion en RLS policy de unilevel_tree
-- Mismo fix que se aplicó a get_unilevel_tree

CREATE OR REPLACE FUNCTION public.get_unilevel_downline(root_id uuid, max_depth integer DEFAULT 9)
 RETURNS TABLE(user_id uuid, depth integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT ut.user_id, (nlevel(ut.path) - nlevel(r.path))::INT AS depth
    FROM public.unilevel_tree ut, public.unilevel_tree r
    WHERE r.user_id = root_id
      AND ut.path <@ r.path
      AND nlevel(ut.path) - nlevel(r.path) BETWEEN 1 AND max_depth
    ORDER BY depth;
END;
$function$;
