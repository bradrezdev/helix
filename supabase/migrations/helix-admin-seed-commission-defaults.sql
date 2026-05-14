-- Seed default commission percentages into admin_settings
-- These match the hardcoded values currently used in monthly-closure Edge Function
-- Each value stored as decimal string (e.g. "0.25" = 25%)
-- ON CONFLICT DO NOTHING preserves any existing overrides

INSERT INTO public.admin_settings (key, value, updated_at)
VALUES
  ('commission.pct.patrocinio_l1', '0.25', now()),
  ('commission.pct.patrocinio_l2', '0.15', now()),
  ('commission.pct.patrocinio_l3', '0.05', now()),
  ('commission.pct.uninivel_l1', '0.06', now()),
  ('commission.pct.uninivel_l2', '0.08', now()),
  ('commission.pct.uninivel_l3', '0.10', now()),
  ('commission.pct.uninivel_l4', '0.12', now()),
  ('commission.pct.uninivel_l5', '0.05', now()),
  ('commission.pct.uninivel_l6', '0.04', now()),
  ('commission.pct.uninivel_l7', '0.03', now()),
  ('commission.pct.uninivel_l8', '0.02', now()),
  ('commission.pct.uninivel_l9', '0.02', now()),
  ('commission.pct.match', '0.10', now()),
  ('closure.date.default', '0', now())
ON CONFLICT (key) DO NOTHING;
