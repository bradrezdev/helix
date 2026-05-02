-- Create rank_advance_bonus_claims table for tracking bonus claims
CREATE TABLE IF NOT EXISTS public.rank_advance_bonus_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  rank_name text NOT NULL,
  bonus_amount numeric NOT NULL DEFAULT 0,
  claimed_at timestamptz DEFAULT now(),
  period_month int NOT NULL,
  period_year int NOT NULL,
  CONSTRAINT unique_rank_per_user UNIQUE (user_id, rank_name)
);

-- Enable Row Level Security
ALTER TABLE public.rank_advance_bonus_claims ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT for own rows or admin
DROP POLICY IF EXISTS "rank_advance_bonus_claims_select_own_or_admin" ON public.rank_advance_bonus_claims;
CREATE POLICY "rank_advance_bonus_claims_select_own_or_admin" ON public.rank_advance_bonus_claims
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- RLS: INSERT via SECURITY DEFINER RPC only (system inserts)
DROP POLICY IF EXISTS "rank_advance_bonus_claims_insert_system" ON public.rank_advance_bonus_claims;
CREATE POLICY "rank_advance_bonus_claims_insert_system" ON public.rank_advance_bonus_claims
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
