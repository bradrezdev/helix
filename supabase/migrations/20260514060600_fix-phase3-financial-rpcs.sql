-- Phase 3: Financial RPC fixes — ATOMIC migration
-- Fix 10 (T3.1): No double PV for kit components
-- Fix 09 (T3.2): No commissions for cliente_preferente sponsors
-- Fix 13 (T3.3+T3.4): Sponsorship bonus USD→local currency conversion
--
-- All 3 fixes must deploy together — they touch same RPCs.

-- ================================================================
-- FIX 10: place_order_with_membership — only kit products count PV/CV
-- ================================================================
CREATE OR REPLACE FUNCTION public.place_order_with_membership(
    p_user_id uuid,
    p_items jsonb,
    p_total_amount numeric,
    p_payment_method text,
    p_payment_ref text DEFAULT NULL::text,
    p_shipping_data jsonb DEFAULT NULL::jsonb,
    p_tax_amount numeric DEFAULT 0,
    p_with_membership boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id    uuid := gen_random_uuid();
  v_order_code  text;
  v_status      order_status := 'pending';
  v_paid_at     timestamptz;
  v_item        jsonb;
  v_wallet_bal  numeric;
  v_total_pv    numeric := 0;
  v_total_cv    numeric := 0;
  v_has_memb   boolean;
  v_first_code text;
  v_first_kit_type text;
  v_country text;
  v_item_is_kit boolean;
BEGIN
  IF auth.uid() != p_user_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Get buyer's country from profile, default to 'MXN' if NULL
  SELECT COALESCE(country, 'MXN') INTO v_country FROM public.users WHERE id = p_user_id;

  IF p_payment_method = 'wallet' THEN
    SELECT balance INTO v_wallet_bal FROM public.wallets
    WHERE user_id = p_user_id AND currency = 'MXN' AND wallet_type = 'disponible'
    FOR UPDATE;
    IF v_wallet_bal IS NULL OR v_wallet_bal < p_total_amount THEN
      RAISE EXCEPTION 'insufficient_wallet_balance';
    END IF;
    UPDATE public.wallets SET balance = balance - p_total_amount, updated_at = now()
    WHERE user_id = p_user_id AND currency = 'MXN' AND wallet_type = 'disponible';
    v_status  := 'paid';
    v_paid_at := now();
  END IF;

  -- Fix 10: Only count PV/CV from kit products (is_kit=true), not individual components
  SELECT
    COALESCE(SUM(((item->>'pv')::numeric) * ((item->>'quantity')::int)), 0),
    COALESCE(SUM(((item->>'cv')::numeric) * ((item->>'quantity')::int)), 0)
  INTO v_total_pv, v_total_cv
  FROM jsonb_array_elements(p_items) AS item
  JOIN public.products p ON p.code = item->>'product_code'
  WHERE p.is_kit = true;

  IF p_with_membership THEN
    SELECT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_items) AS item
      JOIN public.products p ON p.code = item->>'product_code'
      WHERE p.kit_type = 'membresia'
    ) INTO v_has_memb;
  END IF;

  IF v_has_memb THEN
    UPDATE public.users
    SET membership = 'socio', rank = COALESCE(rank, 'Socio'), updated_at = now()
    WHERE id = p_user_id AND membership IN ('cliente_preferente', 'socio_pendiente');

    -- Generate link_referido for new socios if missing
    UPDATE public.users
    SET link_referido = 'usuario_' || id || '_' || encode(extensions.gen_random_bytes(4), 'hex')
    WHERE id = p_user_id AND link_referido IS NULL;
  END IF;

  -- Get first non-membership product code (for commission trigger)
  SELECT item->>'product_code'
  INTO v_first_code
  FROM jsonb_array_elements(p_items) AS item
  JOIN public.products p ON p.code = item->>'product_code'
  WHERE p.kit_type IS DISTINCT FROM 'membresia'
  LIMIT 1;

  INSERT INTO public.orders (
    id, user_id, status, total_amount, pv, cv, is_kit, product_code,
    paid_at, tax_amount, metadata, created_at, country
  ) VALUES (
    v_order_id, p_user_id, v_status, p_total_amount, v_total_pv, v_total_cv,
    true, v_first_code, v_paid_at, p_tax_amount,
    jsonb_build_object('payment_method', p_payment_method, 'payment_ref', p_payment_ref,
      'shipping', p_shipping_data, 'with_membership', v_has_memb),
    now(), v_country
  );

  -- Fix 10: Read actual is_kit from products table instead of hardcoding true.
  -- Non-kit components get pv=0, cv=0 to prevent double counting.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT is_kit INTO v_item_is_kit FROM public.products WHERE code = v_item->>'product_code';
    IF v_item_is_kit IS NULL THEN v_item_is_kit := false; END IF;

    INSERT INTO public.order_items (id, order_id, user_id, product_code, product_name,
      quantity, unit_price, total_amount, pv, cv, is_kit, created_at)
    VALUES (gen_random_uuid(), v_order_id, p_user_id,
      v_item->>'product_code', v_item->>'product_name',
      (v_item->>'quantity')::int, (v_item->>'unit_price')::numeric,
      ((v_item->>'quantity')::int) * ((v_item->>'unit_price')::numeric),
      CASE WHEN v_item_is_kit THEN (v_item->>'pv')::numeric ELSE 0 END,
      CASE WHEN v_item_is_kit THEN (v_item->>'cv')::numeric ELSE 0 END,
      v_item_is_kit, now());
  END LOOP;

  SELECT o.order_id INTO v_order_code FROM public.orders o WHERE o.id = v_order_id;
  UPDATE public.orders SET process_verified = true WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id, 'order_code', v_order_code, 'status', v_status,
    'membership_upgraded', v_has_memb, 'process_verified', true
  );
END;
$function$;

-- ================================================================
-- FIX 9 + FIX 13: process_instant_commissions
--   Fix 9: Skip commissions when sponsor is cliente_preferente
--   Fix 13: Convert spons. bonus from USD to sponsor's local currency
-- ================================================================
CREATE OR REPLACE FUNCTION public.process_instant_commissions()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
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
    -- Fix 13: sponsor country → currency mapping
    v_sponsor_country varchar(3);
    v_mapped_currency varchar(3);
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') AND NEW.commission_locked = false THEN
        v_period_month := EXTRACT(MONTH FROM NEW.paid_at)::int;
        v_period_year  := EXTRACT(YEAR  FROM NEW.paid_at)::int;

        SELECT COALESCE(w.currency, 'MXN') INTO v_buyer_currency
          FROM wallets w WHERE w.user_id = NEW.user_id AND w.wallet_type = 'disponible' LIMIT 1;
        IF v_buyer_currency IS NULL THEN v_buyer_currency := 'MXN'; END IF;

        -- BONO VENTA DIRECTA (same as before)
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

        -- ACTIVACIÓN CLIENTES PREFERENTES (same)
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
                SELECT u.user_id INTO v_sponsor_id FROM users u WHERE u.id = NEW.user_id;

                -- Convert sponsor's bigint user_id to UUID for tree traversal
                SELECT id INTO current_sponsor FROM users WHERE user_id = v_sponsor_id;

                level := 1;
                max_pct_paid := 0;
                inf_max_pct_paid := 0;

                WHILE current_sponsor IS NOT NULL LOOP
                    SELECT rank INTO user_rank FROM users WHERE id = current_sponsor;

                    -- Fix 9: Skip commission if sponsor is cliente_preferente
                    SELECT membership INTO v_sponsor_membership FROM users WHERE id = current_sponsor;
                    IF v_sponsor_membership = 'cliente_preferente' THEN
                        -- Advance to next sponsor, skip this level
                        SELECT u.id INTO current_sponsor FROM users u WHERE u.user_id = (
                            SELECT sponsor_id FROM users WHERE id = current_sponsor
                        );
                        level := level + 1;
                        CONTINUE;
                    END IF;

                    -- Fix 13: Convert from USD to sponsor's local currency using country mapping
                    SELECT country INTO v_sponsor_country FROM users WHERE id = current_sponsor;
                    v_mapped_currency := CASE COALESCE(v_sponsor_country, 'MX')
                        WHEN 'MX' THEN 'MXN'
                        WHEN 'US' THEN 'USD'
                        WHEN 'CO' THEN 'COP'
                        WHEN 'EU' THEN 'EUR'
                        ELSE 'USD'
                    END;
                    v_exch_rate := 1;
                    IF v_mapped_currency != 'USD' THEN
                        SELECT rate INTO v_exch_rate FROM exchange_rates
                          WHERE from_currency = 'USD' AND to_currency = v_mapped_currency LIMIT 1;
                        IF NOT FOUND THEN v_exch_rate := 1; END IF;
                    END IF;

                    -- Bono Patrocinio niveles 1-3
                    IF level <= 3 THEN
                        pct := CASE level
                            WHEN 1 THEN 0.25 WHEN 2 THEN 0.15 WHEN 3 THEN 0.05 ELSE 0
                        END;
                        differential_pct := pct - max_pct_paid;
                        IF differential_pct > 0 THEN
                            bonus_amount := kit_cv * differential_pct; -- USD amount
                            v_converted_amount := bonus_amount * v_exch_rate;
                            INSERT INTO commissions (user_id, period_month, period_year, bono_type, amount, source_order_id, source_user_id, level, calculated_at, currency, original_amount, exchange_rate)
                            VALUES (current_sponsor, v_period_month, v_period_year, 'patrocinio', v_converted_amount, NEW.id, NEW.user_id, level, NOW(), v_mapped_currency, bonus_amount, v_exch_rate);
                        END IF;
                        IF pct > max_pct_paid THEN max_pct_paid := pct; END IF;
                    END IF;

                    -- Bono Infinito de Patrocinio (nivel >= 4)
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
                            bonus_amount := kit_cv * differential_pct; -- USD amount
                            v_converted_amount := bonus_amount * v_exch_rate;
                            INSERT INTO commissions (user_id, period_month, period_year, bono_type, amount, source_order_id, source_user_id, level, calculated_at, currency, original_amount, exchange_rate)
                            VALUES (current_sponsor, v_period_month, v_period_year, 'infinito_patrocinio', v_converted_amount, NEW.id, NEW.user_id, level, NOW(), v_mapped_currency, bonus_amount, v_exch_rate);
                        END IF;
                        IF current_inf_pct > inf_max_pct_paid THEN inf_max_pct_paid := current_inf_pct; END IF;
                    END IF;

                    -- Move to next sponsor
                    SELECT u.id INTO current_sponsor FROM users u WHERE u.user_id = (
                        SELECT sponsor_id FROM users WHERE id = current_sponsor
                    );
                    level := level + 1;
                END LOOP;
            END IF;
        END IF;

        NEW.commission_locked := true;
    END IF;
    RETURN NEW;
END;
$function$;
