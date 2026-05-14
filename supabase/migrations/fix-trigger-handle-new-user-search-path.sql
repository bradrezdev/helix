-- Fix: SET search_path debe incluir 'extensions' para que gen_random_bytes() funcione
-- gen_random_bytes() vive en el schema 'extensions' (extensión pgcrypto instalada ahí)
-- Sin esto: ERROR: function gen_random_bytes(integer) does not exist → 500 error al registrar

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
  v_gender text;
  v_link_hash text;
BEGIN
  v_sponsor_id := (NEW.raw_user_meta_data->>'sponsor_id')::bigint;
  v_membership := COALESCE(NEW.raw_user_meta_data->>'membership', 'socio_pendiente');
  v_gender := NULLIF(NEW.raw_user_meta_data->>'gender', '');
  v_link_hash := encode(gen_random_bytes(4), 'hex');

  INSERT INTO public.users (
    id, name, apellidos, email, membership, sponsor_id, country,
    gender, enrollment_date, link_referido, user_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    NEW.email,
    v_membership,
    v_sponsor_id,
    COALESCE(NEW.raw_user_meta_data->>'country', 'MX'),
    v_gender,
    CURRENT_DATE,
    CASE WHEN NEW.email IS NOT NULL
      THEN 'usuario_' || nextval('users_user_id_seq') || '_' || v_link_hash
      ELSE NULL
    END,
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
