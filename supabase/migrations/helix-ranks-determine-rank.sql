-- BACKUP: Original determine_rank RPC as extracted from live Supabase
-- This will be refactored below to read from the ranks table.
-- Keep this backup for rollback reference.

CREATE OR REPLACE FUNCTION public.determine_rank(p_user_id uuid, p_month integer, p_year integer)
 RETURNS rank_type
 LANGUAGE plpgsql
AS $function$
DECLARE
    personal_pv DECIMAL(10,2);
    vg DECIMAL(10,2);
    max_leg DECIMAL(10,2);
    other_legs DECIMAL(10,2);
    leg_volumes DECIMAL(10,2)[];
    child RECORD;
    rank_record RECORD;
BEGIN
    -- PV personal (compras propias no promotor)
    SELECT COALESCE(SUM(o.pv), 0) INTO personal_pv
    FROM orders o
    WHERE o.user_id = p_user_id
      AND o.status = 'paid'
      AND EXTRACT(MONTH FROM o.paid_at) = p_month
      AND EXTRACT(YEAR FROM o.paid_at) = p_year
      AND o.is_from_preferred_client = false
      AND o.price_type != 'promotor';

    -- Atribución del 50% del PV de clientes preferentes directos
    SELECT personal_pv + COALESCE(SUM(o.pv * 0.5), 0) INTO personal_pv
    FROM orders o
    WHERE o.preferred_sponsor_id = p_user_id
      AND o.status = 'paid'
      AND o.is_from_preferred_client = true
      AND EXTRACT(MONTH FROM o.paid_at) = p_month
      AND EXTRACT(YEAR FROM o.paid_at) = p_year;

    -- Requisito mínimo de PV personal
    IF personal_pv < 100 THEN
        RETURN 'Socio';
    END IF;

    -- Calcular Volumen Grupal (VG)
    vg := calculate_group_vg(p_user_id, p_month, p_year);

    -- Obtener volúmenes de piernas (hijos directos en patrocinio)
    FOR child IN SELECT id FROM users WHERE sponsor_id = p_user_id
    LOOP
        leg_volumes := array_append(leg_volumes, calculate_group_vg(child.id, p_month, p_year));
    END LOOP;

    -- Ordenar descendente
    IF array_length(leg_volumes, 1) IS NOT NULL THEN
        SELECT ARRAY(SELECT unnest(leg_volumes) ORDER BY 1 DESC) INTO leg_volumes;
        max_leg := leg_volumes[1];
        other_legs := COALESCE((SELECT SUM(v) FROM unnest(leg_volumes[2:]) AS v), 0);
    ELSE
        max_leg := 0;
        other_legs := 0;
    END IF;

    -- Evaluar rangos desde ranks table, de mayor a menor nivel
    FOR rank_record IN SELECT * FROM ranks ORDER BY level DESC
    LOOP
        IF personal_pv < rank_record.min_pv THEN
            CONTINUE;
        END IF;
        IF rank_record.min_group_vg IS NOT NULL AND vg < rank_record.min_group_vg THEN
            CONTINUE;
        END IF;
        IF rank_record.min_longest_leg IS NOT NULL AND max_leg > rank_record.min_longest_leg THEN
            CONTINUE;
        END IF;
        IF rank_record.min_other_legs IS NOT NULL AND other_legs < rank_record.min_other_legs THEN
            CONTINUE;
        END IF;
        -- All conditions met for this rank
        RETURN rank_record.name::rank_type;
    END LOOP;

    RETURN 'Socio';
END;
$function$;
