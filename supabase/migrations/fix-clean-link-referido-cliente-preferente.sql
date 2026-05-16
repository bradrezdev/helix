-- Fix: Clean up link_referido for existing cliente_preferente users
-- They should NOT have referral links since they can't earn commissions
UPDATE public.users 
SET link_referido = NULL 
WHERE membership = 'cliente_preferente' 
  AND link_referido IS NOT NULL;
