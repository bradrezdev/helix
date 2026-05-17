-- Migration: 20260516200000_fix_audit_unilevel_traceability
-- Purpose: Refactor ALL bonus calculation functions to create auditable
-- individual commission rows with source_user_id, level, and metadata.
-- Each centavo now has full traceability.

-- =====================================================================
-- STEP 1: Drop dependent functions (process_monthly_closure calls all)
-- =====================================================================

DROP FUNCTION IF EXISTS process_monthly_closure(p_month integer, p_year integer);
DROP FUNCTION IF EXISTS calculate_unilevel_bonus(p_user_id uuid, p_month integer, p_year integer, p_is_midmonth boolean);
DROP FUNCTION IF EXISTS calculate_infinito_unilevel_bonus(p_user_id uuid, p_month integer, p_year integer);
DROP FUNCTION IF EXISTS calculate_match_bonus(p_user_id uuid, p_month integer, p_year integer);
DROP FUNCTION IF EXISTS calculate_promotor_bonus(p_user_id uuid, p_period_month integer, p_period_year integer);

-- =====================================================================
-- STEP 2: Recreate calculate_unilevel_bonus with per-row INSERTs
-- Iterates each downline member and creates 1 commission row per
-- contributor with source_user_id + level + metadata.
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_unilevel_bonus(
    p_user_id uuid,
    p_month integer,
    p_year integer,
    p_is_midmonth boolean DEFAULT false
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    downline      RECORD;
    total_bonus   DECIMAL(10,2) := 0;
    percentages   DECIMAL(5,3)[] := ARRAY[0.06,0.08,0.10,0.12,0.05,0.04,0.03,0.02,0.02];
    v_cv          DECIMAL(10,2);
    ht_cv         DECIMAL(10,2);
    v_amount      DECIMAL(10,2);
    v_date_from   timestamptz;
    v_date_to     timestamptz;
    v_period_half smallint;
BEGIN
    IF p_is_midmonth THEN
        v_date_from := make_timestamptz(p_year, p_month, 1,  0, 0, 0, 'UTC');
        v_date_to   := make_timestamptz(p_year, p_month, 15, 23, 59, 59, 'UTC');
        v_period_half := 1;
    ELSE
        v_date_from := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
        v_date_to   := (make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC')
                        + interval '1 month' - interval '1 microsecond');
        v_period_half := 2;
    END IF;

    -- Iterate each downline member depth 1-9 — 1 INSERT per contributor
    FOR downline IN
        SELECT ut.user_id, (nlevel(ut.path) - nlevel(r.path)) AS depth
        FROM unilevel_tree ut, unilevel_tree r
        WHERE r.user_id = p_user_id
          AND ut.path <@ r.path
          AND nlevel(ut.path) - nlevel(r.path) BETWEEN 1 AND 9
        ORDER BY depth
    LOOP
        -- CV from direct orders (exclude preferred client and promotor)
        SELECT COALESCE(SUM(o.cv), 0) INTO v_cv
        FROM orders o
        WHERE o.user_id = downline.user_id
          AND o.status = 'paid'
          AND o.paid_at >= v_date_from
          AND o.paid_at <= v_date_to
          AND o.is_from_preferred_client = false
          AND o.price_type != 'promotor';

        -- CV from preferred client orders (50% attribution)
        SELECT v_cv + COALESCE(SUM(o.cv * 0.5), 0) INTO v_cv
        FROM orders o
        WHERE o.preferred_sponsor_id = downline.user_id
          AND o.status = 'paid'
          AND o.is_from_preferred_client = true
          AND o.paid_at >= v_date_from
          AND o.paid_at <= v_date_to;

        -- Only insert if CV > 0 (avoids zero-amount rows)
        IF v_cv > 0 THEN
            v_amount := ROUND(v_cv * percentages[downline.depth], 2);
            total_bonus := total_bonus + v_amount;

            INSERT INTO commissions (
                user_id, period_month, period_year, period_half,
                bono_type, amount, original_amount, currency,
                source_user_id, level, metadata, calculated_at
            ) VALUES (
                p_user_id, p_month, p_year, v_period_half,
                'unilevel', v_amount, v_amount, 'MXN',
                downline.user_id, downline.depth,
                jsonb_build_object(
                    'cv_contribuido', ROUND(v_cv, 2),
                    'porcentaje', percentages[downline.depth],
                    'depth', downline.depth
                ),
                NOW()
            );
        END IF;
    END LOOP;

    -- Holding tank users at depth 1
    SELECT COALESCE(SUM(o.cv), 0) INTO ht_cv
    FROM public.holding_tank ht
    JOIN public.users u ON u.id = ht.member_id
    JOIN public.orders o ON o.user_id = u.id
    WHERE ht.sponsor_id = p_user_id
      AND o.status = 'paid'
      AND o.paid_at >= v_date_from
      AND o.paid_at <= v_date_to
      AND o.is_from_preferred_client = false
      AND o.price_type != 'promotor';

    SELECT ht_cv + COALESCE(SUM(o.cv * 0.5), 0) INTO ht_cv
    FROM public.holding_tank ht
    JOIN public.users u ON u.id = ht.member_id
    JOIN public.orders o ON o.preferred_sponsor_id = u.id
    WHERE ht.sponsor_id = p_user_id
      AND o.status = 'paid'
      AND o.is_from_preferred_client = true
      AND o.paid_at >= v_date_from
      AND o.paid_at <= v_date_to;

    IF ht_cv > 0 THEN
        v_amount := ROUND(ht_cv * percentages[1], 2);
        total_bonus := total_bonus + v_amount;

        INSERT INTO commissions (
            user_id, period_month, period_year, period_half,
            bono_type, amount, original_amount, currency,
            source_user_id, level, metadata, calculated_at
        ) VALUES (
            p_user_id, p_month, p_year, v_period_half,
            'unilevel', v_amount, v_amount, 'MXN',
            NULL, 1,
            jsonb_build_object(
                'cv_contribuido', ROUND(ht_cv, 2),
                'porcentaje', percentages[1],
                'depth', 1,
                'holding_tank', true
            ),
            NOW()
        );
    END IF;

    RETURN total_bonus;
END;
$$;

-- =====================================================================
-- STEP 3: Recreate calculate_infinito_unilevel_bonus with per-row INSERTs
-- Creates 1 commission row per qualifying downline node (depth >= 10)
-- with source_user_id, level, rank-based percentage breakdown.
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_infinito_unilevel_bonus(
    p_user_id uuid,
    p_month integer,
    p_year integer
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    user_rank rank_type;
    user_pct DECIMAL(5,4);
    downline RECORD;
    total_bonus DECIMAL(10,2) := 0;
    down_rank rank_type;
    down_pct DECIMAL(5,4);
    diff_pct DECIMAL(5,4);
    cv DECIMAL(10,2);
    v_amount DECIMAL(10,2);
BEGIN
    SELECT rank INTO user_rank FROM users WHERE id = p_user_id;
    user_pct := CASE user_rank
        WHEN 'Platino' THEN 0.005
        WHEN 'Diamante' THEN 0.0075
        WHEN 'Doble Diamante' THEN 0.01
        WHEN 'Triple Diamante' THEN 0.0125
        WHEN 'Diamante Embajador' THEN 0.015
        WHEN 'Doble Diamante Embajador' THEN 0.0175
        WHEN 'Triple Diamante Embajador' THEN 0.02
        ELSE 0
    END;
    IF user_pct = 0 THEN RETURN 0; END IF;

    -- Iterate downline nodes at depth >= 10, excluding sub-branches
    -- blocked by a higher-rank descendant ("tapadas")
    FOR downline IN
        SELECT ut.user_id, (nlevel(ut.path) - nlevel(r.path)) AS depth
        FROM unilevel_tree ut
        JOIN unilevel_tree r ON r.user_id = p_user_id
        WHERE ut.path <@ r.path
          AND nlevel(ut.path) - nlevel(r.path) >= 10
          AND ut.user_id != p_user_id
          AND NOT EXISTS (
              SELECT 1
              FROM unilevel_tree mid
              JOIN users umid ON umid.id = mid.user_id
              WHERE mid.path <@ r.path
                AND ut.path <@ mid.path
                AND mid.user_id != p_user_id
                AND mid.user_id != ut.user_id
                AND nlevel(mid.path) - nlevel(r.path) >= 10
                AND umid.rank IN (
                    'Platino','Diamante','Doble Diamante','Triple Diamante',
                    'Diamante Embajador','Doble Diamante Embajador','Triple Diamante Embajador'
                )
          )
    LOOP
        SELECT rank INTO down_rank FROM users WHERE id = downline.user_id;
        down_pct := CASE down_rank
            WHEN 'Platino' THEN 0.005
            WHEN 'Diamante' THEN 0.0075
            WHEN 'Doble Diamante' THEN 0.01
            WHEN 'Triple Diamante' THEN 0.0125
            WHEN 'Diamante Embajador' THEN 0.015
            WHEN 'Doble Diamante Embajador' THEN 0.0175
            WHEN 'Triple Diamante Embajador' THEN 0.02
            ELSE 0
        END;
        diff_pct := user_pct - down_pct;
        IF diff_pct > 0 THEN
            SELECT COALESCE(SUM(o.cv), 0) INTO cv
            FROM orders o
            WHERE o.user_id = downline.user_id
              AND o.status = 'paid'
              AND EXTRACT(MONTH FROM o.paid_at) = p_month
              AND EXTRACT(YEAR FROM o.paid_at) = p_year
              AND o.is_from_preferred_client = false
              AND o.price_type != 'promotor';

            SELECT cv + COALESCE(SUM(o.cv * 0.5), 0) INTO cv
            FROM orders o
            WHERE o.preferred_sponsor_id = downline.user_id
              AND o.status = 'paid'
              AND o.is_from_preferred_client = true
              AND EXTRACT(MONTH FROM o.paid_at) = p_month
              AND EXTRACT(YEAR FROM o.paid_at) = p_year;

            IF cv > 0 THEN
                v_amount := ROUND(cv * diff_pct, 2);
                total_bonus := total_bonus + v_amount;

                INSERT INTO commissions (
                    user_id, period_month, period_year, period_half,
                    bono_type, amount, original_amount, currency,
                    source_user_id, level, metadata, calculated_at
                ) VALUES (
                    p_user_id, p_month, p_year, 2,
                    'infinito_unilevel', v_amount, v_amount, 'MXN',
                    downline.user_id, downline.depth,
                    jsonb_build_object(
                        'cv_contribuido', ROUND(cv, 2),
                        'user_rank', user_rank::text,
                        'user_pct', user_pct,
                        'down_rank', down_rank::text,
                        'down_pct', down_pct,
                        'diff_pct', diff_pct,
                        'depth', downline.depth
                    ),
                    NOW()
                );
            END IF;
        END IF;
    END LOOP;

    RETURN total_bonus;
END;
$$;

-- =====================================================================
-- STEP 4: Recreate calculate_match_bonus with per-row INSERTs
-- Creates 1 commission row per unilevel commission matched from
-- sponsor downline (depth 1-5).
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_match_bonus(
    p_user_id uuid,
    p_month integer,
    p_year integer
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
    user_rank    rank_type;
    caller_uid   bigint;
    pct_n1       DECIMAL(5,3) := 0;
    pct_n2       DECIMAL(5,3) := 0;
    pct_n3       DECIMAL(5,3) := 0;
    pct_n4       DECIMAL(5,3) := 0;
    pct_n5       DECIMAL(5,3) := 0;
    v_pct        DECIMAL(5,3);
    total_match  DECIMAL(10,2) := 0;
    match_rec    RECORD;
    v_amount     DECIMAL(10,2);
BEGIN
    -- Get caller's rank and numeric user_id
    SELECT rank, user_id
      INTO user_rank, caller_uid
      FROM users
     WHERE id = p_user_id;

    -- Match percentages by rank
    CASE user_rank
        WHEN 'Plata'                    THEN pct_n1 := 0.05;
        WHEN 'Oro'                      THEN pct_n1 := 0.10;
        WHEN 'Platino'                  THEN pct_n1 := 0.15;
        WHEN 'Diamante'                 THEN pct_n1 := 0.25; pct_n2 := 0.05;
        WHEN 'Doble Diamante'           THEN pct_n1 := 0.25; pct_n2 := 0.10; pct_n3 := 0.10;
        WHEN 'Triple Diamante'          THEN pct_n1 := 0.25; pct_n2 := 0.15; pct_n3 := 0.10; pct_n4 := 0.05;
        WHEN 'Diamante Embajador'       THEN pct_n1 := 0.25; pct_n2 := 0.15; pct_n3 := 0.10; pct_n4 := 0.05; pct_n5 := 0.01;
        WHEN 'Doble Diamante Embajador' THEN pct_n1 := 0.25; pct_n2 := 0.15; pct_n3 := 0.10; pct_n4 := 0.05; pct_n5 := 0.03;
        WHEN 'Triple Diamante Embajador'THEN pct_n1 := 0.25; pct_n2 := 0.15; pct_n3 := 0.10; pct_n4 := 0.05; pct_n5 := 0.05;
        ELSE RETURN 0;
    END CASE;

    -- Iterate each unilevel commission earned by sponsor downline members
    -- Create 1 match commission row per matched unilevel commission
    FOR match_rec IN
        WITH RECURSIVE sponsor_tree AS (
            SELECT u.id AS node_id, u.user_id AS node_uid, 1 AS depth
            FROM users u
            WHERE u.sponsor_id = caller_uid
              AND u.membership = 'socio'
              AND u.is_active = true

            UNION ALL

            SELECT u.id, u.user_id, st.depth + 1
            FROM users u
            JOIN sponsor_tree st ON u.sponsor_id = st.node_uid
            WHERE st.depth < 5
              AND u.membership = 'socio'
              AND u.is_active = true
        )
        SELECT
            st.node_id,
            st.depth,
            c.id     AS commission_id,
            c.amount AS commission_amount
        FROM sponsor_tree st
        JOIN commissions c ON c.user_id = st.node_id
        WHERE c.period_month = p_month
          AND c.period_year  = p_year
          AND c.bono_type    = 'unilevel'
          AND c.amount > 0
    LOOP
        v_pct := CASE match_rec.depth
            WHEN 1 THEN pct_n1
            WHEN 2 THEN pct_n2
            WHEN 3 THEN pct_n3
            WHEN 4 THEN pct_n4
            WHEN 5 THEN pct_n5
            ELSE 0
        END;

        IF v_pct > 0 THEN
            v_amount := ROUND(match_rec.commission_amount * v_pct, 2);
            total_match := total_match + v_amount;

            INSERT INTO commissions (
                user_id, period_month, period_year, period_half,
                bono_type, amount, original_amount, currency,
                source_user_id, level, metadata, calculated_at
            ) VALUES (
                p_user_id, p_month, p_year, 2,
                'match', v_amount, v_amount, 'MXN',
                match_rec.node_id, match_rec.depth,
                jsonb_build_object(
                    'porcentaje', v_pct,
                    'source_commission_id', match_rec.commission_id::text,
                    'source_commission_amount', match_rec.commission_amount,
                    'depth', match_rec.depth,
                    'user_rank', user_rank::text
                ),
                NOW()
            );
        END IF;
    END LOOP;

    RETURN total_match;
END;
$$;

-- =====================================================================
-- STEP 5: Recreate calculate_promotor_bonus with metadata + source_user_id
-- Now stores tracking_id, CV total and per-bono metadata for audit.
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_promotor_bonus(
    p_user_id uuid,
    p_period_month integer,
    p_period_year integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_cv        numeric(12,2);
  v_new_bonos       int;
  v_prev_bonos      int := 0;
  v_delta_bonos     int := 0;
  v_period_end      date;
  i                 int;
  v_tracking_id     int;
BEGIN
  -- Sum CV for period (exclude "kit superior")
  SELECT COALESCE(SUM(o.cv), 0)
    INTO v_total_cv
    FROM orders o
   WHERE o.user_id = p_user_id
     AND o.status = 'paid'
     AND EXTRACT(MONTH FROM o.paid_at) = p_period_month
     AND EXTRACT(YEAR  FROM o.paid_at) = p_period_year
     AND NOT (o.is_kit = true AND o.kit_type = 'superior');

  v_new_bonos := COALESCE(FLOOR(v_total_cv / 200)::int, 0);

  -- Get previously earned bonos for this period
  BEGIN
    SELECT COALESCE(earned, 0)
      INTO STRICT v_prev_bonos
      FROM promotor_bonus_tracking
     WHERE user_id = p_user_id
       AND period_month = p_period_month
       AND period_year  = p_period_year;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      v_prev_bonos := 0;
  END;

  IF v_new_bonos <= v_prev_bonos THEN
    RETURN;
  END IF;

  v_delta_bonos := COALESCE(v_new_bonos - v_prev_bonos, 0);

  IF v_delta_bonos <= 0 THEN
    RETURN;
  END IF;

  v_period_end := (make_date(p_period_year, p_period_month, 1) + interval '1 month - 1 day')::date;

  INSERT INTO promotor_bonus_tracking (
    user_id, period_month, period_year,
    cv_accumulated, earned, used, expires_at, updated_at
  )
  VALUES (
    p_user_id, p_period_month, p_period_year,
    v_total_cv, v_new_bonos, 0, v_period_end, now()
  )
  ON CONFLICT (user_id, period_month, period_year)
  DO UPDATE SET
    cv_accumulated = EXCLUDED.cv_accumulated,
    earned         = EXCLUDED.earned,
    expires_at     = EXCLUDED.expires_at,
    updated_at     = now()
  RETURNING id INTO v_tracking_id;

  -- Insert one commission row per new bono with metadata
  FOR i IN 1..v_delta_bonos LOOP
    INSERT INTO commissions (
      user_id, period_month, period_year, bono_type,
      amount, original_amount, currency, source_user_id,
      level, metadata, calculated_at
    )
    VALUES (
      p_user_id, p_period_month, p_period_year, 'bono_promotor',
      0, 0, 'MXN', p_user_id,
      i,
      jsonb_build_object(
        'cv_total', v_total_cv,
        'bono_numero', i,
        'total_delta', v_delta_bonos,
        'ltp_points_per_bono', 4,
        'tracking_id', v_tracking_id
      ),
      now()
    );

    INSERT INTO ltp_entries (user_id, points, reason, period_month, period_year, created_at)
    VALUES (p_user_id, 4, 'bono_promotor_individual', p_period_month, p_period_year, now());

    UPDATE users SET ltp_points = ltp_points + 4 WHERE id = p_user_id;
  END LOOP;

  UPDATE users SET promotor_bonos = COALESCE(promotor_bonos, 0) + v_delta_bonos WHERE id = p_user_id;

END;
$$;

-- =====================================================================
-- STEP 6: Recreate process_monthly_closure
-- Changes from original:
--   - Steps 2-4: REPLACED uni_bonus/match_bonus variable capture + manual INSERT
--     with PERFORM call (functions now self-insert with audit trail)
--   - Step 5 (avance_rango): Added explicit source_user_id=NULL, level=NULL,
--     currency='MXN', original_amount for consistency
-- All other behavior preserved exactly.
-- =====================================================================

CREATE OR REPLACE FUNCTION process_monthly_closure(
    p_month integer,
    p_year integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    user_record    RECORD;
    new_rank       rank_type;
    vg             DECIMAL(10,2);
    rank_bonus     DECIMAL(10,2);
    fidelity_pts   INT;
    ltp_pts        INT;
    direct_ltp     INT;
    rank_advance_ltp INT;
    v_acumulado_wallet RECORD;
    promotor_ltp   INT;
    promotor_sets  INT;
    v_sponsor_uuid uuid;
BEGIN
    LOCK TABLE orders IN SHARE MODE;
    LOCK TABLE users IN SHARE MODE;

    -- Clear existing commissions for the period (idempotency)
    DELETE FROM commissions
    WHERE period_month = p_month
      AND period_year  = p_year
      AND period_half  = 2
      AND bono_type IN (
          'unilevel','infinito_unilevel','match','diferencial_patrocinio'
      );

    DELETE FROM ltp_entries
    WHERE period_month = p_month
      AND period_year  = p_year
      AND reason NOT LIKE 'kit%';

    -- Paso 1: Recalcular VG y rangos
    FOR user_record IN
        SELECT id, rank AS old_rank FROM users WHERE membership = 'socio' AND is_active = true
    LOOP
        vg := calculate_group_vg(user_record.id, p_month, p_year);
        SELECT determine_rank(user_record.id, p_month, p_year) INTO new_rank;
        UPDATE users SET rank = new_rank, group_vg = vg WHERE id = user_record.id;
    END LOOP;

    -- Diferencial de Patrocinio
    PERFORM calculate_diferencial_patrocinio(p_month, p_year);

    -- Bono Promotor (now inserts commission rows with metadata)
    FOR user_record IN
        SELECT id FROM users WHERE membership = 'socio' AND is_active = true
    LOOP
        PERFORM calculate_promotor_bonus(user_record.id, p_month, p_year);
    END LOOP;

    -- Paso 2: Bono Uninivel (function now self-inserts individual rows)
    FOR user_record IN
        SELECT id FROM users WHERE membership = 'socio'
    LOOP
        PERFORM calculate_unilevel_bonus(user_record.id, p_month, p_year, false);
    END LOOP;

    -- Paso 3: Bono Infinito Uninivel (function now self-inserts individual rows)
    FOR user_record IN
        SELECT id FROM users
        WHERE rank IN (
            'Platino','Diamante','Doble Diamante','Triple Diamante',
            'Diamante Embajador','Doble Diamante Embajador','Triple Diamante Embajador'
        )
        AND membership = 'socio' AND is_active = true
    LOOP
        PERFORM calculate_infinito_unilevel_bonus(user_record.id, p_month, p_year);
    END LOOP;

    -- Paso 4: Bono Match (function now self-inserts individual rows)
    FOR user_record IN
        SELECT id FROM users
        WHERE rank IN (
            'Plata','Oro','Platino','Diamante','Doble Diamante','Triple Diamante',
            'Diamante Embajador','Doble Diamante Embajador','Triple Diamante Embajador'
        )
        AND membership = 'socio' AND is_active = true
    LOOP
        PERFORM calculate_match_bonus(user_record.id, p_month, p_year);
    END LOOP;

    -- Paso 5: Bono Avance de Rango + LTP
    FOR user_record IN
        SELECT id, rank, achieved_ranks, enrollment_date FROM users WHERE membership = 'socio'
    LOOP
        rank_bonus := calculate_rank_advance_bonus(user_record.id, user_record.rank, p_month, p_year);
        IF rank_bonus > 0 THEN
            IF NOT EXISTS (
                SELECT 1 FROM commissions
                WHERE user_id = user_record.id
                  AND bono_type = 'avance_rango'
                  AND period_month = p_month AND period_year = p_year
                  AND metadata->>'rank' = user_record.rank::text
            ) THEN
                INSERT INTO commissions (
                    user_id, period_month, period_year, period_half,
                    bono_type, amount, original_amount, currency,
                    source_user_id, level, metadata, calculated_at
                )
                VALUES (
                    user_record.id, p_month, p_year, 2, 'avance_rango', rank_bonus,
                    rank_bonus, 'MXN', NULL, NULL,
                    jsonb_build_object('rank', user_record.rank::text),
                    NOW()
                );
                UPDATE users SET achieved_ranks = array_append(achieved_ranks, user_record.rank::text)
                WHERE id = user_record.id;

                rank_advance_ltp := CASE user_record.rank
                    WHEN 'Bronce'::rank_type                    THEN 5
                    WHEN 'Plata'::rank_type                     THEN 10
                    WHEN 'Oro'::rank_type                       THEN 20
                    WHEN 'Platino'::rank_type                   THEN 30
                    WHEN 'Diamante'::rank_type                  THEN 50
                    WHEN 'Doble Diamante'::rank_type            THEN 50
                    WHEN 'Triple Diamante'::rank_type           THEN 50
                    WHEN 'Diamante Embajador'::rank_type        THEN 50
                    WHEN 'Doble Diamante Embajador'::rank_type  THEN 50
                    WHEN 'Triple Diamante Embajador'::rank_type THEN 50
                    ELSE 0
                END;
                IF rank_advance_ltp > 0 THEN
                    INSERT INTO ltp_entries (user_id, points, reason, period_month, period_year, created_at)
                    VALUES (user_record.id, rank_advance_ltp,
                            'avance_rango_' || user_record.rank::text, p_month, p_year, NOW());
                    UPDATE users SET ltp_points = ltp_points + rank_advance_ltp WHERE id = user_record.id;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Paso 6: Puntos de Fidelidad
    FOR user_record IN
        SELECT id FROM users WHERE membership IN ('socio','cliente_preferente')
    LOOP
        SELECT calculate_fidelity_points(user_record.id, p_month, p_year) INTO fidelity_pts;
        IF fidelity_pts > 0 THEN
            UPDATE users SET fidelity_points = fidelity_points + fidelity_pts WHERE id = user_record.id;
        END IF;
    END LOOP;

    -- Paso 7: LTP por mantenimiento de rango + LTP por directos
    FOR user_record IN
        SELECT u.id, u.rank, u.sponsor_id
        FROM users u
        WHERE u.membership = 'socio'
          AND u.is_active = true
          AND u.rank <> 'Socio'::rank_type
          AND u.rank::text = ANY(u.achieved_ranks)
    LOOP
        ltp_pts := CASE user_record.rank
            WHEN 'Bronce'::rank_type                    THEN 5
            WHEN 'Plata'::rank_type                     THEN 10
            WHEN 'Oro'::rank_type                       THEN 20
            WHEN 'Platino'::rank_type                   THEN 30
            WHEN 'Diamante'::rank_type                  THEN 50
            WHEN 'Doble Diamante'::rank_type            THEN 50
            WHEN 'Triple Diamante'::rank_type           THEN 50
            WHEN 'Diamante Embajador'::rank_type        THEN 50
            WHEN 'Doble Diamante Embajador'::rank_type  THEN 50
            WHEN 'Triple Diamante Embajador'::rank_type THEN 50
            ELSE 0
        END;
        IF ltp_pts > 0 THEN
            INSERT INTO ltp_entries (user_id, points, reason, period_month, period_year, created_at)
            VALUES (user_record.id, ltp_pts, 'mantenimiento_rango_' || user_record.rank::text, p_month, p_year, NOW());
            UPDATE users SET ltp_points = ltp_points + ltp_pts WHERE id = user_record.id;
        END IF;

        -- LTP to sponsor for maintaining ranked downline
        IF user_record.sponsor_id IS NOT NULL THEN
            SELECT u2.id INTO v_sponsor_uuid FROM users u2 WHERE u2.user_id = user_record.sponsor_id;

            IF v_sponsor_uuid IS NOT NULL THEN
                direct_ltp := CASE user_record.rank
                    WHEN 'Bronce'::rank_type                    THEN 1
                    WHEN 'Plata'::rank_type                     THEN 3
                    WHEN 'Oro'::rank_type                       THEN 5
                    WHEN 'Platino'::rank_type                   THEN 10
                    WHEN 'Diamante'::rank_type                  THEN 25
                    WHEN 'Doble Diamante'::rank_type            THEN 25
                    WHEN 'Triple Diamante'::rank_type           THEN 25
                    WHEN 'Diamante Embajador'::rank_type        THEN 25
                    WHEN 'Doble Diamante Embajador'::rank_type  THEN 25
                    WHEN 'Triple Diamante Embajador'::rank_type THEN 25
                    ELSE 0
                END;
                IF direct_ltp > 0 THEN
                    INSERT INTO ltp_entries (user_id, points, reason, source_user_id, period_month, period_year, created_at)
                    VALUES (v_sponsor_uuid, direct_ltp,
                            'ltp_directo_mantiene_' || user_record.rank::text,
                            user_record.id, p_month, p_year, NOW());
                    UPDATE users SET ltp_points = ltp_points + direct_ltp WHERE id = v_sponsor_uuid;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Paso 7.5: LTP por Bonos Promotor
    FOR user_record IN
        SELECT id, promotor_bonos FROM users
        WHERE membership = 'socio' AND is_active = true AND promotor_bonos >= 5
    LOOP
        promotor_sets := floor(user_record.promotor_bonos / 5);
        promotor_ltp  := promotor_sets * 10;
        INSERT INTO ltp_entries (user_id, points, reason, period_month, period_year, created_at)
        VALUES (user_record.id, promotor_ltp,
                'bono_promotor_5x_' || promotor_sets::text || '_sets', p_month, p_year, NOW());
        UPDATE users SET ltp_points = ltp_points + promotor_ltp WHERE id = user_record.id;
    END LOOP;

    -- Paso 8: Reasignación de comisiones de patrocinio de inactivos
    PERFORM process_sponsorship_inactive_reassignment(p_month, p_year);

    -- Paso 9: Resetear contadores mensuales
    UPDATE users SET
        personal_pv    = 0,
        personal_cv    = 0,
        promotor_bonos = 0
    WHERE membership = 'socio';

    -- Paso 10: Marcar órdenes como comisionadas
    UPDATE orders SET commission_locked = true
    WHERE status = 'paid'
      AND EXTRACT(MONTH FROM paid_at) = p_month
      AND EXTRACT(YEAR  FROM paid_at) = p_year;

    -- Paso 11: Forfeit acumulado wallets de socios aún inactivos
    FOR v_acumulado_wallet IN
        SELECT w.id, w.user_id, w.balance, w.currency
        FROM wallets w
        WHERE w.wallet_type = 'acumulado'
          AND w.balance > 0
          AND NOT is_user_active_this_month(w.user_id, p_month, p_year)
    LOOP
        INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, description, balance_after)
        VALUES (v_acumulado_wallet.id, v_acumulado_wallet.user_id,
                -v_acumulado_wallet.balance, 'acumulado_perdido',
                'No activado al cierre del período ' || p_month || '/' || p_year || ' — saldo redistribuido',
                0);
        UPDATE wallets SET balance = 0, updated_at = now() WHERE id = v_acumulado_wallet.id;
    END LOOP;

    -- Paso 12: Acreditar comisiones mensuales a wallets
    PERFORM payout_monthly_commissions(p_month, p_year);

END;
$$;
