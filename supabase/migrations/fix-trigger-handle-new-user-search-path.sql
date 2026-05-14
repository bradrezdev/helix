-- Fix: SET search_path debe incluir 'extensions' para que gen_random_bytes() funcione
-- Fix: Convertir 'socio' → 'socio_pendiente' al registrar (se activa al comprar membresia)
-- Fix: link_referido = NULL hasta que membership se active como 'socio'

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_sponsor_id bigint;
  v_user_id int;
  v_membership text;
  v_membership_final text;
  v_gender text;
  v_link_hash text;
BEGIN
  v_sponsor_id := (NEW.raw_user_meta_data->>'sponsor_id')::bigint;
  v_membership := COALESCE(NEW.raw_user_meta_data->>'membership', 'socio_pendiente');
  v_gender := NULLIF(NEW.raw_user_meta_data->>'gender', '');
  v_link_hash := encode(gen_random_bytes(4), 'hex');

  -- Convert 'socio' to 'socio_pendiente' — membership activates after payment
  IF v_membership = 'socio' THEN
    v_membership_final := 'socio_pendiente';
  ELSE
    v_membership_final := v_membership;
  END IF;

  INSERT INTO public.users (
    id, name, apellidos, email, membership, sponsor_id, country,
    gender, enrollment_date, link_referido, user_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    NEW.email,
    v_membership_final::membership_type,
    v_sponsor_id,
    COALESCE(NEW.raw_user_meta_data->>'country', 'MX'),
    v_gender,
    CURRENT_DATE,
    NULL,  -- link_referido generated when membership activates (after payment)
    nextval('users_user_id_seq')
  )
  ON CONFLICT (id) DO NOTHING;

  UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id AND email_confirmed_at IS NULL;

  IF v_sponsor_id IS NOT NULL THEN
    INSERT INTO public.holding_tank (sponsor_id, member_id, entered_at)
    VALUES (
      (SELECT id FROM public.users WHERE user_id = v_sponsor_id),
      NEW.id, now()
    )
    ON CONFLICT (member_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
