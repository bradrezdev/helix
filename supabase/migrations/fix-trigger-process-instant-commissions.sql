-- Fix: trigger trg_orders_commissions_after_insert was pointing to the OLD function
-- process_instant_commissions_after() instead of the NEW function process_instant_commissions()
-- which contains Fix 9 (cliente_preferente skip), Fix 10 (no double PV), Fix 13 (currency conversion).
-- This caused: commissions without currency conversion, cliente_preferente earning bonuses,
-- and all commissions having currency=NULL.

-- Drop old trigger pointing to wrong function
DROP TRIGGER IF EXISTS trg_orders_commissions_after_insert ON public.orders;

-- Recreate trigger pointing to the CORRECT function
CREATE TRIGGER trg_orders_commissions_after_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_instant_commissions();

-- Clean up orphan commissions generated with NULL currency
UPDATE public.commissions 
SET process_verified = false, 
    amount = 0 
WHERE currency IS NULL;
