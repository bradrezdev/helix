-- Fix: place_order_with_membership RPC fails with "function gen_random_bytes(integer) does not exist"
-- Root cause: SET search_path TO 'public' excludes 'extensions' schema where pgcrypto lives
-- Fix: Use explicit extensions.gen_random_bytes() prefix

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
BEGIN
  IF auth.uid() != p_user_id AND NOT is_admin() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

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

  SELECT
    COALESCE(SUM(((item->>'pv')::numeric) * ((item->>'quantity')::int)), 0),
    COALESCE(SUM(((item->>'cv')::numeric) * ((item->>'quantity')::int)), 0)
  INTO v_total_pv, v_total_cv
  FROM jsonb_array_elements(p_items) AS item;

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
    paid_at, tax_amount, metadata, created_at
  ) VALUES (
    v_order_id, p_user_id, v_status, p_total_amount, v_total_pv, v_total_cv,
    true, v_first_code, v_paid_at, p_tax_amount,
    jsonb_build_object('payment_method', p_payment_method, 'payment_ref', p_payment_ref,
      'shipping', p_shipping_data, 'with_membership', v_has_memb),
    now()
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (id, order_id, user_id, product_code, product_name,
      quantity, unit_price, total_amount, pv, cv, is_kit, created_at)
    VALUES (gen_random_uuid(), v_order_id, p_user_id,
      v_item->>'product_code', v_item->>'product_name',
      (v_item->>'quantity')::int, (v_item->>'unit_price')::numeric,
      ((v_item->>'quantity')::int) * ((v_item->>'unit_price')::numeric),
      (v_item->>'pv')::numeric, (v_item->>'cv')::numeric, true, now());
  END LOOP;

  SELECT o.order_id INTO v_order_code FROM public.orders o WHERE o.id = v_order_id;
  UPDATE public.orders SET process_verified = true WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id, 'order_code', v_order_code, 'status', v_status,
    'membership_upgraded', v_has_memb, 'process_verified', true
  );
END;
$function$;
