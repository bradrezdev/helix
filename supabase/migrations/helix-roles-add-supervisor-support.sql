-- Add role columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_supervisor boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_support boolean DEFAULT false;

-- Create role changes audit table
CREATE TABLE IF NOT EXISTS public.role_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES public.users(id),
  old_roles jsonb DEFAULT '{}',
  new_roles jsonb DEFAULT '{}',
  changed_at timestamptz DEFAULT now()
);

-- RLS for role_changes: only admin can insert, authenticated can select their own
ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_changes_select_own" ON public.role_changes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth_is_admin());

CREATE POLICY "role_changes_insert_admin" ON public.role_changes
  FOR INSERT TO authenticated
  WITH CHECK (auth_is_admin());
