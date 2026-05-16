-- ============================================================================
-- Migration: fix-mlm-audit-bugs-3-8
-- Description: Fix 6 compensation plan bugs found by César MLM audit
-- Bugs: 1, 3+4, 4-bis, 6, 7, 8
-- Supabase ref: elqonjnniophqdnwhtbo
-- ============================================================================

-- ============================================================================
-- BUG 3+4: Diferencial de Patrocinio — wrong bono_type filter + never called
-- Fix 1: Change 'bono_patrocinio' → 'patrocinio' in the function
-- ============================================================================
CREATE OR REPLACE FUNCTION public.calculate_diferencial_patrocinio(
    p_period_month integer,
    p_period_year integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    rec           RECORD;
    sponsor_rank  rank_type;
    descend_rank  rank_type;
    sponsor_pct   DECIMAL(5,4);
    descend_pct   DECIMAL(5,4);
    net_pct       DECIMAL(5,4);
    base_cv       DECIMAL(12,4);
    dif_amount    DECIMAL(12,4);
BEGIN
    -- Iterate over all level-1 patrocinio commissions for the period
    FOR rec IN
        SELECT
            c.id            AS commission_id,
            c.user_id       AS beneficiary_id,   -- the sponsor who earned patrocinio
            c.source_user_id AS descendant_id,   -- the new recruit who triggered it
            c.amount,
            c.currency,
            c.original_amount,
            c.exchange_rate,
            c.source_order_id
        FROM commissions c
        WHERE c.bono_type    = 'patrocinio'       -- BUG 3+4 FIX: was 'bono_patrocinio'
          AND c.level        = 1
          AND c.period_month = p_period_month
          AND c.period_year  = p_period_year
    LOOP
        -- Get sponsor's current rank (updated by Paso 1 of closure)
        SELECT rank INTO sponsor_rank
        FROM users
        WHERE id = rec.beneficiary_id;

        sponsor_pct := get_diferencial_patrocinio_pct(sponsor_rank);

        -- No rank → no diferencial
        IF sponsor_pct = 0 THEN
            CONTINUE;
        END IF;

        -- Get descendant's rank for compression rule
        descend_pct := 0;
        IF rec.descendant_id IS NOT NULL THEN
            SELECT get_diferencial_patrocinio_pct(rank) INTO descend_pct
            FROM users
            WHERE id = rec.descendant_id;
        END IF;

        -- Net differential = sponsor_pct - descendant_pct (min 0)
        net_pct := GREATEST(0, sponsor_pct - descend_pct);

        IF net_pct = 0 THEN
            CONTINUE;
        END IF;

        -- Derive base CV: level-1 patrocinio base = 25% of CV
        -- base_cv = commission_amount / 0.25
        base_cv := rec.amount / 0.25;

        dif_amount := ROUND(base_cv * net_pct, 2);

        IF dif_amount <= 0 THEN
            CONTINUE;
        END IF;

        -- Insert idempotently (source_order_id + user_id + type is the natural key)
        INSERT INTO commissions (
            user_id,
            period_month,
            period_year,
            bono_type,
            amount,
            source_order_id,
            source_user_id,
            level,
            currency,
            original_amount,
            exchange_rate,
            calculated_at,
            metadata
        )
        VALUES (
            rec.beneficiary_id,
            p_period_month,
            p_period_year,
            'diferencial_patrocinio',
            dif_amount,
            rec.source_order_id,
            rec.descendant_id,
            1,
            rec.currency,
            CASE
                WHEN rec.exchange_rate IS NOT NULL AND rec.exchange_rate != 0
                THEN ROUND(dif_amount * rec.exchange_rate, 2)
                ELSE NULL
            END,
            rec.exchange_rate,
            NOW(),
            jsonb_build_object(
                'sponsor_rank',   sponsor_rank::text,
                'sponsor_pct',    sponsor_pct,
                'descend_pct',    descend_pct,
                'net_pct',        net_pct,
                'base_cv',        base_cv,
                'source_commission_id', rec.commission_id
            )
        )
        ON CONFLICT DO NOTHING;

    END LOOP;
END;
$$;


-- ============================================================================
-- BUG 1: Mid-month Unilevel not paid
-- Fix: payout_monthly_commissions() only processed period_half = 2.
-- Change to period_half IN (1, 2) so mid-month commissions also get paid.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.payout_monthly_commissions(
    p_month integer,
    p_year integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row           RECORD;
    v_wallet_id     UUID;
    v_currency      TEXT;
    v_total         NUMERIC(12,2);
    v_count         INT := 0;
BEGIN
    -- Agregar por (user_id, currency) los bonos mensuales no pagados
    FOR v_row IN
        SELECT
            c.user_id,
            COALESCE(c.currency, 'MXN') AS currency,
            SUM(c.amount) AS total_amount
        FROM commissions c
        WHERE c.period_month = p_month
          AND c.period_year  = p_year
          AND c.period_half  IN (1, 2)         -- BUG 1 FIX: include mid-month (period_half=1)
          AND c.paid_at IS NULL
          AND c.amount > 0
          AND c.bono_type IN (
              'unilevel', 'infinito_unilevel', 'match',
              'diferencial_patrocinio', 'avance_rango'
          )
        GROUP BY c.user_id, COALESCE(c.currency, 'MXN')
    LOOP
        -- Buscar o crear wallet disponible en esa moneda
        SELECT id INTO v_wallet_id
        FROM wallets
        WHERE user_id    = v_row.user_id
          AND currency   = v_row.currency
          AND wallet_type = 'disponible'
        LIMIT 1;

        IF v_wallet_id IS NULL THEN
            INSERT INTO wallets (user_id, balance, currency, wallet_type, updated_at)
            VALUES (v_row.user_id, 0, v_row.currency, 'disponible', now())
            RETURNING id INTO v_wallet_id;
        END IF;

        -- Acreditar
        UPDATE wallets
        SET balance    = balance + v_row.total_amount,
            updated_at = now()
        WHERE id = v_wallet_id;

        -- Log wallet transaction
        INSERT INTO wallet_transactions (
            wallet_id, user_id, amount, type, description, balance_after
        )
        SELECT
            v_wallet_id,
            v_row.user_id,
            v_row.total_amount,
            'payout_mensual',
            'Comisiones mensuales ' || p_month || '/' || p_year,
            w.balance
        FROM wallets w WHERE w.id = v_wallet_id;

        -- Marcar comisiones como pagadas
        UPDATE commissions
        SET paid_at = now()
        WHERE user_id      = v_row.user_id
          AND period_month = p_month
          AND period_year  = p_year
          AND period_half  IN (1, 2)           -- BUG 1 FIX: include mid-month
          AND paid_at IS NULL
          AND amount > 0
          AND bono_type IN (
              'unilevel', 'infinito_unilevel', 'match',
              'diferencial_patrocinio', 'avance_rango'
          )
          AND COALESCE(currency, 'MXN') = v_row.currency;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;


-- ============================================================================
-- BUG 7: is_user_active_this_month uses o.created_at instead of o.paid_at
-- Fix: Change EXTRACT(MONTH FROM o.created_at) → EXTRACT(MONTH FROM o.paid_at)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_user_active_this_month(
    p_user_id uuid,
    p_month integer,
    p_year integer
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_pv numeric;
BEGIN
  SELECT COALESCE(SUM(
    CASE WHEN p.is_kit THEN p.pv ELSE oi.quantity * p.pv END
  ), 0)
  INTO v_pv
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.code = oi.product_code
  WHERE o.user_id = p_user_id
    AND o.status = 'paid'
    AND EXTRACT(MONTH FROM o.paid_at) = p_month    -- BUG 7 FIX: was o.created_at
    AND EXTRACT(YEAR  FROM o.paid_at) = p_year      -- BUG 7 FIX: was o.created_at
    AND (p.kit_type IS NULL OR p.kit_type != 'membresia');
  RETURN v_pv >= 100;
END;
$$;


-- ============================================================================
-- BUG 8: Activation check uses PV instead of CV
-- Fix: orders_after_update_handler() checks personal_pv >= 100
-- but the plan requires 100 CV minimum. Change to personal_cv.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.orders_after_update_handler()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_membresia BOOLEAN;
  v_already_socio BOOLEAN;
  v_month int;
  v_year int;
  v_acumulado_wallet RECORD;
  v_disponible_balance numeric;
  v_total_cv numeric;                       -- BUG 8 FIX: was v_total_pv
BEGIN
  -- Solo actuar cuando el pedido cambia a 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    
    -- ============================================================
    -- PASO 1: Actualizar PV/CV del usuario
    -- ============================================================
    UPDATE public.users
    SET
      personal_pv = COALESCE(personal_pv, 0) + COALESCE(NEW.pv, 0),
      personal_cv = COALESCE(personal_cv, 0) + COALESCE(NEW.cv, 0)
    WHERE id = NEW.user_id;
    
    -- ============================================================
    -- PASO 2: Upgrade de membresía si el pedido contiene membresía
    -- ============================================================
    SELECT EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON p.code = oi.product_code
      WHERE oi.order_id = NEW.id AND p.category = 'membership'
    ) INTO v_has_membresia;
    
    IF v_has_membresia THEN
      SELECT membership = 'socio' INTO v_already_socio
      FROM public.users WHERE id = NEW.user_id;
      
      IF NOT v_already_socio THEN
        UPDATE public.users
        SET membership = 'socio', updated_at = now()
        WHERE id = NEW.user_id;
      END IF;
    END IF;
    
    -- ============================================================
    -- PASO 3: Release de acumulado si el usuario se activa
    -- ============================================================
    v_month := EXTRACT(MONTH FROM now())::int;
    v_year := EXTRACT(YEAR FROM now())::int;
    
    -- Calcular CV total del usuario después de esta orden  -- BUG 8 FIX
    SELECT COALESCE(personal_cv, 0) INTO v_total_cv         -- BUG 8 FIX: was personal_pv
    FROM public.users WHERE id = NEW.user_id;
    
    -- Si alcanzó 100 CV este mes, liberar acumulado          -- BUG 8 FIX
    IF v_total_cv >= 100 THEN                                -- BUG 8 FIX: was v_total_pv >= 100
      FOR v_acumulado_wallet IN
        SELECT w.id, w.balance, w.currency
        FROM public.wallets w
        WHERE w.user_id = NEW.user_id
          AND w.wallet_type = 'acumulado'
          AND w.balance > 0
      LOOP
        -- Encontrar wallet disponible en misma moneda
        SELECT id, balance INTO v_disponible_balance
        FROM public.wallets
        WHERE user_id = NEW.user_id
          AND currency = v_acumulado_wallet.currency
          AND wallet_type = 'disponible';
        
        IF v_disponible_balance IS NOT NULL THEN
          -- Transferir de acumulado a disponible
          UPDATE public.wallets
          SET balance = balance - v_acumulado_wallet.balance,
              updated_at = now()
          WHERE id = v_acumulado_wallet.id;
          
          UPDATE public.wallets
          SET balance = balance + v_acumulado_wallet.balance,
              updated_at = now()
          WHERE user_id = NEW.user_id
            AND currency = v_acumulado_wallet.currency
            AND wallet_type = 'disponible';
          
          INSERT INTO public.wallet_transactions
            (wallet_id, user_id, amount, type, description, balance_after, reference_id)
          VALUES
            (v_acumulado_wallet.id, NEW.user_id, -v_acumulado_wallet.balance,
             'acumulado_release', 'Activación mensual — acumulado liberado a disponible',
             (SELECT balance FROM wallets WHERE id = v_acumulado_wallet.id), NEW.id);
        END IF;
      END LOOP;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;


-- ============================================================================
-- BUG 6: LTP kits not implemented
-- Fix: process_instant_commissions declares ltp_points_earned but never uses it.
-- Add LTP awarding for kit purchases inside the first-kit block.
--   kit_type = 'basico'     → +1 LTP
--   kit_type = 'intermedio' → +2 LTP
--   kit_type = 'superior'   → +4 LTP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_instant_commissions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    kit_cv DECIMAL(10,2);
    v_sponsor_id BIGINT;
    current_sponsor UUID;
    level INT := 0;
    pct DECIMAL(5,3);
    bonus_amount DECIMAL(10,2);
    user_rank rank_type;
    ltp_points_earned INT := 0;
    public_price DECIMAL(10,2);
    socio_price DECIMAL(10,2);
    max_pct_paid DECIMAL(5,3) := 0;
    inf_max_pct_paid DECIMAL(5,3) := 0;
    current_inf_pct DECIMAL(5,3);
    differential_pct DECIMAL(5,3);
    v_buyer_currency varchar(3);
    v_recipient_currency varchar(3);
    v_exch_rate numeric(10,6);
    v_converted_amount DECIMAL(10,2);
    v_prior_kit_count INT := 0;
    v_product_kit_type TEXT;
    v_kit_superior_count INT := 0;
    v_kit_superior_bonus_multiple INT := 0;
    v_prev_bonus_multiples INT := 0;
    v_new_bonus_multiples INT := 0;
    v_is_active BOOLEAN;
    v_acumulado_wallet_id UUID;
    v_disponible_wallet_id UUID;
    v_period_month INT;
    v_period_year INT;
    -- Fix 9: sponsor membership check
    v_sponsor_membership membership_type;
    -- Fix 13: sponsor country to currency mapping
    v_sponsor_country varchar(3);
    v_mapped_currency varchar(3);
    -- Bug 4: wallet credit variables
    v_wallet_balance DECIMAL(10,2);
    v_wallet_id UUID;
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.commission_locked = false THEN
        v_period_month := EXTRACT(MONTH FROM NEW.paid_at)::int;
        v_period_year  := EXTRACT(YEAR  FROM NEW.paid_at)::int;

        SELECT COALESCE(w.currency, 'MXN') INTO v_buyer_currency
          FROM wallets w WHERE w.user_id = NEW.user_id AND w.wallet_type = 'disponible' LIMIT 1;
        IF v_buyer_currency IS NULL THEN v_buyer_currency := 'MXN'; END IF;

        -- BONO VENTA DIRECTA
        IF NEW.price_type = 'public' AND NEW.is_kit = false AND NEW.product_code IS NOT NULL THEN
            EXECUTE format('SELECT price_public_%I, price_socio_%I FROM products WHERE code = %L',
                lower(NEW.country::text), lower(NEW.country::text), NEW.product_code)
            INTO public_price, socio_price;
            bonus_amount := (public_price - socio_price) * NEW.quantity;
            IF bonus_amount > 0 THEN
                SELECT COALESCE(w.currency, 'MXN') INTO v_recipient_currency
                  FROM wallets w WHERE w.user_id = NEW.user_id AND w.wallet_type = 'disponible' LIMIT 1;
                IF v_recipient_currency IS NULL THEN v_recipient_currency := v_buyer_currency; END IF;
                v_exch_rate := 1; v_converted_amount := bonus_amount;
                IF v_buyer_currency != v_recipient_currency THEN
                    SELECT rate INTO v_exch_rate FROM exchange_rates
                      WHERE from_currency = v_buyer_currency AND to_currency = v_recipient_currency LIMIT 1;
                    IF FOUND THEN v_converted_amount := bonus_amount * v_exch_rate;
                    ELSE v_exch_rate := 1; v_converted_amount := bonus_amount; END IF;
                END IF;
                INSERT INTO commissions (user_id, period_month, period_year, bono_type, amount, source_order_id, calculated_at, currency, original_amount, exchange_rate)
                VALUES (NEW.user_id, v_period_month, v_period_year, 'venta_directa', v_converted_amount, NEW.id, NOW(), v_recipient_currency, bonus_amount, v_exch_rate);
            END IF;
        END IF;

        -- ACTIVACION CLIENTES PREFERENTES
        IF NEW.is_from_preferred_client AND NEW.preferred_sponsor_id IS NOT NULL THEN
            bonus_amount := NEW.cv * 0.20;
            SELECT COALESCE(w.currency, 'MXN') INTO v_recipient_currency
              FROM wallets w WHERE w.user_id = NEW.preferred_sponsor_id AND w.wallet_type = 'disponible' LIMIT 1;
            IF v_recipient_currency IS NULL THEN v_recipient_currency := v_buyer_currency; END IF;
            v_exch_rate := 1; v_converted_amount := bonus_amount;
            IF v_buyer_currency != v_recipient_currency THEN
                SELECT rate INTO v_exch_rate FROM exchange_rates
                  WHERE from_currency = v_buyer_currency AND to_currency = v_recipient_currency LIMIT 1;
                IF FOUND THEN v_converted_amount := bonus_amount * v_exch_rate;
                ELSE v_exch_rate := 1; v_converted_amount := bonus_amount; END IF;
            END IF;
            INSERT INTO commissions (user_id, period_month, period_year, bono_type, amount, source_order_id, source_user_id, calculated_at, currency, original_amount, exchange_rate)
            VALUES (NEW.preferred_sponsor_id, v_period_month, v_period_year, 'cliente_preferente', v_converted_amount, NEW.id, NEW.user_id, NOW(), v_recipient_currency, bonus_amount, v_exch_rate);
        END IF;

        -- BONO PATROCINIO + INFINITO (SOLO KITS)
        IF NEW.is_kit THEN
            SELECT COALESCE(p.kit_type, '') INTO v_product_kit_type
              FROM products p WHERE p.code = NEW.product_code LIMIT 1;

            SELECT COUNT(*) INTO v_prior_kit_count
              FROM orders o
             WHERE o.user_id = NEW.user_id
               AND o.is_kit = true
               AND o.status = 'paid'
               AND o.commission_locked = true
               AND o.id != NEW.id;

            IF v_product_kit_type != 'membresia' AND v_prior_kit_count = 0 THEN
                kit_cv := NEW.cv;

                -- Get the BUYER's SPONSOR (not the buyer's own user_id!)
                SELECT COALESCE(u.sponsor_id, 0) INTO v_sponsor_id
                FROM users u WHERE u.id = NEW.user_id;

                IF v_sponsor_id > 0 THEN
                    SELECT id INTO current_sponsor FROM users WHERE user_id = v_sponsor_id;
                ELSE
                    current_sponsor := NULL;
                END IF;

                level := 1;
                max_pct_paid := 0;
                inf_max_pct_paid := 0;

                WHILE current_sponsor IS NOT NULL LOOP
                    SELECT rank INTO user_rank FROM users WHERE id = current_sponsor;

                    -- Fix 9: Skip commission if sponsor is cliente_preferente
                    SELECT membership INTO v_sponsor_membership FROM users WHERE id = current_sponsor;
                    IF v_sponsor_membership = 'cliente_preferente' THEN
                        SELECT u.id INTO current_sponsor FROM users u WHERE u.user_id = (
                            SELECT sponsor_id FROM users WHERE id = current_sponsor
                        );
                        level := level + 1;
                        CONTINUE;
                    END IF;

                    -- Fix 13: Convert USD to sponsor's local currency via country mapping
                    SELECT country INTO v_sponsor_country FROM users WHERE id = current_sponsor;
                    v_mapped_currency := CASE COALESCE(v_sponsor_country, 'MX')
                        WHEN 'MX' THEN 'MXN'
                        WHEN 'US' THEN 'USD'
                        WHEN 'CO' THEN 'COP'
                        WHEN 'ES' THEN 'EUR'
                        ELSE 'USD'
                    END;
                    v_exch_rate := 1;
                    IF v_mapped_currency != 'USD' THEN
                        SELECT rate INTO v_exch_rate FROM exchange_rates
                          WHERE from_currency = 'USD' AND to_currency = v_mapped_currency LIMIT 1;
                        IF NOT FOUND THEN v_exch_rate := 1; END IF;
                    END IF;

                    -- BUG 1 FIX: For niveles 1-3, pay FULL percentage (not differential)
                    IF level <= 3 THEN
                        pct := CASE level
                            WHEN 1 THEN 0.25 WHEN 2 THEN 0.15 WHEN 3 THEN 0.05 ELSE 0
                        END;
                        -- Pay full percentage for niveles 1-3, not differential
                        bonus_amount := kit_cv * pct;
                        v_converted_amount := bonus_amount * v_exch_rate;
                        INSERT INTO commissions (user_id, period_month, period_year, bono_type, amount, source_order_id, source_user_id, level, calculated_at, currency, original_amount, exchange_rate)
                        VALUES (current_sponsor, v_period_month, v_period_year, 'patrocinio', v_converted_amount, NEW.id, NEW.user_id, level, NOW(), v_mapped_currency, bonus_amount, v_exch_rate);

                        -- BUG 4 FIX: Credit wallet immediately for patrocinio bonus (instant payout per plan)
                        SELECT id, balance INTO v_wallet_id, v_wallet_balance
                        FROM wallets
                        WHERE user_id = current_sponsor AND wallet_type = 'disponible'
                        LIMIT 1;
                        IF v_wallet_id IS NOT NULL THEN
                            UPDATE wallets SET balance = balance + v_converted_amount, updated_at = NOW()
                            WHERE id = v_wallet_id;
                            INSERT INTO wallet_transactions (wallet_id, user_id, amount, type, reference_id, description, balance_after, created_at)
                            VALUES (v_wallet_id, current_sponsor, v_converted_amount, 'commission_payout',
                                    NEW.id,
                                    'Bono Patrocinio nivel ' || level || ': $' || bonus_amount || ' (' || (pct*100)::int || '% de ' || kit_cv || ' CV)',
                                    v_wallet_balance + v_converted_amount, NOW());
                        END IF;

                        IF pct > max_pct_paid THEN max_pct_paid := pct; END IF;
                    END IF;

                    -- Bono Infinito de Patrocinio (nivel >= 4) — uses differential logic (ascending percentages)
                    IF level >= 4 THEN
                        current_inf_pct := CASE user_rank
                            WHEN 'Bronce' THEN 0.06 WHEN 'Plata' THEN 0.07
                            WHEN 'Oro' THEN 0.08 WHEN 'Platino' THEN 0.09
                            WHEN 'Diamante' THEN 0.10 WHEN 'Doble Diamante' THEN 0.11
                            WHEN 'Triple Diamante' THEN 0.12
                            WHEN 'Diamante Embajador' THEN 0.13
                            WHEN 'Doble Diamante Embajador' THEN 0.14
                            WHEN 'Triple Diamante Embajador' THEN 0.15
                            ELSE 0
                        END;
                        differential_pct := current_inf_pct - inf_max_pct_paid;
                        IF differential_pct > 0 THEN
                            bonus_amount := kit_cv * differential_pct;
                            v_converted_amount := bonus_amount * v_exch_rate;
                            INSERT INTO commissions (user_id, period_month, period_year, bono_type, amount, source_order_id, source_user_id, level, calculated_at, currency, original_amount, exchange_rate)
                            VALUES (current_sponsor, v_period_month, v_period_year, 'infinito_patrocinio', v_converted_amount, NEW.id, NEW.user_id, level, NOW(), v_mapped_currency, bonus_amount, v_exch_rate);
                        END IF;
                        IF current_inf_pct > inf_max_pct_paid THEN inf_max_pct_paid := current_inf_pct; END IF;
                    END IF;

                    -- Move to next sponsor (traverse via sponsor_id)
                    SELECT u.id INTO current_sponsor FROM users u WHERE u.user_id = (
                        SELECT sponsor_id FROM users WHERE id = current_sponsor
                    );
                    level := level + 1;
                END LOOP;

                -- BUG 6 FIX: LTP por compra de primer kit (basado en kit_type)
                ltp_points_earned := CASE v_product_kit_type
                    WHEN 'basico' THEN 1
                    WHEN 'intermedio' THEN 2
                    WHEN 'superior' THEN 4
                    ELSE 0
                END;
                IF ltp_points_earned > 0 THEN
                    INSERT INTO ltp_entries (user_id, points, reason, period_month, period_year, created_at)
                    VALUES (NEW.user_id, ltp_points_earned, 'kit_' || v_product_kit_type, v_period_month, v_period_year, NOW());
                    UPDATE users SET ltp_points = ltp_points + ltp_points_earned WHERE id = NEW.user_id;
                END IF;
            END IF;
        END IF;

        -- BUG 2 FIX: Use explicit UPDATE (AFTER trigger can't modify NEW)
        UPDATE public.orders SET commission_locked = true WHERE id = NEW.id AND commission_locked = false;
    END IF;
    RETURN NEW;
END;
$$;


-- ============================================================================
-- BUG 3+4 & 4-bis: Diferencial de Patrocinio and Promotor Bonus never called
-- Fix: Add calls to both functions in process_monthly_closure between
-- Paso 1 (rank calculation) and Paso 2 (unilevel bonus).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_monthly_closure(
    p_month integer,
    p_year integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record    RECORD;
    new_rank       rank_type;
    prev_rank      rank_type;
    vg             DECIMAL(10,2);
    uni_bonus      DECIMAL(10,2);
    inf_uni_bonus  DECIMAL(10,2);
    match_bonus    DECIMAL(10,2);
    inf_pat_bonus  DECIMAL(10,2);
    rank_bonus     DECIMAL(10,2);
    fidelity_pts   INT;
    ltp_pts        INT;
    direct_record  RECORD;
    direct_ltp     INT;
    rank_advance_ltp INT;
    v_acumulado_wallet RECORD;
    promotor_ltp   INT;
    promotor_sets  INT;
BEGIN
    LOCK TABLE orders IN SHARE MODE;
    LOCK TABLE users IN SHARE MODE;

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

    -- BUG 3+4 FIX: Diferencial de Patrocinio (entre rank y uninivel)
    PERFORM calculate_diferencial_patrocinio(p_month, p_year);

    -- BUG 4-bis FIX: Bono Promotor (entre rank y uninivel)
    FOR user_record IN
        SELECT id FROM users WHERE membership = 'socio' AND is_active = true
    LOOP
        PERFORM calculate_promotor_bonus(user_record.id, p_month, p_year);
    END LOOP;

    -- Paso 2: Bono Uninivel
    FOR user_record IN
        SELECT id FROM users WHERE membership = 'socio'
    LOOP
        uni_bonus := calculate_unilevel_bonus(user_record.id, p_month, p_year, false);
        IF uni_bonus > 0 THEN
            INSERT INTO commissions (user_id, period_month, period_year, period_half, bono_type, amount, calculated_at)
            VALUES (user_record.id, p_month, p_year, 2, 'unilevel', uni_bonus, NOW());
        END IF;
    END LOOP;

    -- Paso 3: Bono Infinito Uninivel
    FOR user_record IN
        SELECT id FROM users
        WHERE rank IN (
            'Platino','Diamante','Doble Diamante','Triple Diamante',
            'Diamante Embajador','Doble Diamante Embajador','Triple Diamante Embajador'
        )
        AND membership = 'socio' AND is_active = true
    LOOP
        inf_uni_bonus := calculate_infinito_unilevel_bonus(user_record.id, p_month, p_year);
        IF inf_uni_bonus > 0 THEN
            INSERT INTO commissions (user_id, period_month, period_year, period_half, bono_type, amount, calculated_at)
            VALUES (user_record.id, p_month, p_year, 2, 'infinito_unilevel', inf_uni_bonus, NOW());
        END IF;
    END LOOP;

    -- Paso 4: Bono Match
    FOR user_record IN
        SELECT id FROM users
        WHERE rank IN (
            'Plata','Oro','Platino','Diamante','Doble Diamante','Triple Diamante',
            'Diamante Embajador','Doble Diamante Embajador','Triple Diamante Embajador'
        )
        AND membership = 'socio' AND is_active = true
    LOOP
        match_bonus := calculate_match_bonus(user_record.id, p_month, p_year);
        IF match_bonus > 0 THEN
            INSERT INTO commissions (user_id, period_month, period_year, period_half, bono_type, amount, calculated_at)
            VALUES (user_record.id, p_month, p_year, 2, 'match', match_bonus, NOW());
        END IF;
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
                INSERT INTO commissions (user_id, period_month, period_year, period_half, bono_type, amount, metadata, calculated_at)
                VALUES (user_record.id, p_month, p_year, 2, 'avance_rango', rank_bonus,
                        jsonb_build_object('rank', user_record.rank::text), NOW());
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

        IF user_record.sponsor_id IS NOT NULL THEN
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
                VALUES (user_record.sponsor_id, direct_ltp,
                        'ltp_directo_mantiene_' || user_record.rank::text,
                        user_record.id, p_month, p_year, NOW());
                UPDATE users SET ltp_points = ltp_points + direct_ltp WHERE id = user_record.sponsor_id;
            END IF;
        END IF;
    END LOOP;

    -- Paso 7.5: LTP por Bonos Promotor (+10 por cada 5 bonos en el mes)
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
