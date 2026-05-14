-- Eliminar trigger BEFORE INSERT que generaba link_referido para TODOS los usuarios.
-- link_referido debe generarse SOLO cuando membership se activa a 'socio'
-- via place_order_with_membership RPC (que ya lo maneja con encode(gen_random_bytes(4), 'hex'))

DROP TRIGGER IF EXISTS trg_set_link_referido ON public.users;
DROP FUNCTION IF EXISTS public.set_link_referido();
