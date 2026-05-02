-- Create ranks table as single source of truth for rank definitions
CREATE TABLE IF NOT EXISTS public.ranks (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  level integer NOT NULL UNIQUE CHECK (level >= 0),
  min_pv numeric NOT NULL DEFAULT 0,
  min_group_vg numeric,
  min_longest_leg numeric,
  min_other_legs numeric,
  bonus_amount numeric NOT NULL DEFAULT 0,
  is_bronze_time_window boolean NOT NULL DEFAULT false,
  image_url text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Seed all 12 ranks per compensation plan (avance-de-rango.md)
INSERT INTO public.ranks (level, name, slug, min_pv, min_group_vg, min_longest_leg, min_other_legs, bonus_amount, is_bronze_time_window) VALUES
  (0,  'Socio',                     'socio',                     0,    NULL, NULL, NULL, 0,     false),
  (1,  'Ejecutivo',                 'ejecutivo',                100,  NULL, NULL, NULL, 0,     false),
  (2,  'Bronce',                    'bronce',                   100,  1000, NULL, NULL, 100,   true),
  (3,  'Plata',                     'plata',                    100,  3000, 1800, 1200, 150,   false),
  (4,  'Oro',                       'oro',                      100,  5000, 3000, 2000, 200,   false),
  (5,  'Platino',                   'platino',                  100,  10000, 6000, 4000, 250,  false),
  (6,  'Diamante',                  'diamante',                 100,  25000, 15000, 10000, 500, false),
  (7,  'Doble Diamante',            'doble-diamante',           100,  50000, 30000, 20000, 1000, false),
  (8,  'Triple Diamante',           'triple-diamante',          100,  100000, 60000, 40000, 2500, false),
  (9,  'Diamante Embajador',        'diamante-embajador',       100,  250000, 150000, 100000, 5000, false),
  (10, 'Doble Diamante Embajador',  'doble-diamante-embajador', 100,  500000, 300000, 200000, 10000, false),
  (11, 'Triple Diamante Embajador', 'triple-diamante-embajador', 100, 1000000, 600000, 400000, 25000, false)
ON CONFLICT (name) DO NOTHING;

-- Index on level for ordering (rank queries ORDER BY level DESC)
CREATE INDEX IF NOT EXISTS idx_ranks_level ON public.ranks (level);

-- Enable Row Level Security
ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT for all authenticated users
DROP POLICY IF EXISTS "ranks_select_authenticated" ON public.ranks;
CREATE POLICY "ranks_select_authenticated" ON public.ranks
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS: INSERT/UPDATE/DELETE for admin only
DROP POLICY IF EXISTS "ranks_admin_all" ON public.ranks;
CREATE POLICY "ranks_admin_all" ON public.ranks
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
