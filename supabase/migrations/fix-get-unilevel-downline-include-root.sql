-- Fix: SECURITY DEFINER + include root user + include names in get_unilevel_downline
-- 1. SECURITY DEFINER para evitar RLS recursion en unilevel_tree
-- 2. Incluye root user (depth 0) para que el PlaceMemberModal no necesite query separada
-- 3. JOIN con public.users para devolver name + apellidos (bypass RLS)

DROP FUNCTION IF EXISTS public.get_unilevel_downline(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_unilevel_downline(root_id uuid, max_depth integer DEFAULT 9)
 RETURNS TABLE(user_id uuid, depth integer, name text, apellidos text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    -- Include the root user at depth 0
    SELECT root_id, 0::INT AS depth,
           COALESCE(u.name::text, 'Yo') AS name,
           COALESCE(u.apellidos::text, '') AS apellidos
    FROM public.users u
    WHERE u.id = root_id
    
    UNION ALL
    
    -- Include all downline users
    SELECT ut.user_id, 
           (nlevel(ut.path) - nlevel(r.path))::INT AS depth,
           COALESCE(u2.name::text, 'Usuario') AS name,
           COALESCE(u2.apellidos::text, '') AS apellidos
    FROM public.unilevel_tree ut
    CROSS JOIN public.unilevel_tree r
    LEFT JOIN public.users u2 ON u2.id = ut.user_id
    WHERE r.user_id = root_id
      AND ut.path <@ r.path
      AND nlevel(ut.path) - nlevel(r.path) BETWEEN 1 AND max_depth
    ORDER BY depth, name;
END;
$function$;
