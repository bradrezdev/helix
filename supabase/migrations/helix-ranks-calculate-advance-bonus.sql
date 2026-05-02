-- Refactored calculate_rank_advance_bonus RPC
-- Reads bonus_amount from ranks table instead of hardcoded CASE.
-- Checks rank_advance_bonus_claims for existing claims.

CREATE OR REPLACE FUNCTION public.calculate_rank_advance_bonus(p_user_id uuid, p_new_rank rank_type, p_month integer, p_year integer)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    enrollment DATE;
    months_since INT;
    bonus_amount DECIMAL(10,2);
    existing_claim RECORD;
BEGIN
    SELECT enrollment_date INTO enrollment
    FROM users WHERE id = p_user_id;

    -- Check if already claimed via rank_advance_bonus_claims table
    SELECT 1 INTO existing_claim
    FROM rank_advance_bonus_claims
    WHERE user_id = p_user_id
      AND rank_name = p_new_rank::text;

    IF FOUND THEN
        RETURN 0;
    END IF;

    -- Validación de ventana temporal para Bono Bronce
    -- Solo aplica en el mes de inscripción (months_since = 0) o el mes siguiente (months_since = 1)
    IF p_new_rank = 'Bronce'::rank_type THEN
        months_since := (p_year - EXTRACT(YEAR FROM enrollment)::int) * 12
                      + (p_month - EXTRACT(MONTH FROM enrollment)::int);

        IF months_since > 1 THEN
            -- Ventana expirada: marcar en claims como perdido para no volver a evaluar
            INSERT INTO rank_advance_bonus_claims (user_id, rank_name, bonus_amount, period_month, period_year)
            VALUES (p_user_id, 'Bronce', 0, p_month, p_year)
            ON CONFLICT (user_id, rank_name) DO NOTHING;
            RETURN 0;  -- No otorgar el bono Bronce
        END IF;
    END IF;

    -- Calcular monto del bono desde la tabla ranks
    SELECT COALESCE(bonus_amount, 0) INTO bonus_amount
    FROM ranks
    WHERE name = p_new_rank::text;

    RETURN bonus_amount;
END;
$function$;
