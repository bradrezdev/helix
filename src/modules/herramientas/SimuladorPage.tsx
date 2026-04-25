import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calculator, TrendingUp, Users, Award, Infinity, Star, AlertCircle, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimConfig {
  directosPorPersona: number   // direct sponsors per person
  nivelesProfundidad: number   // network depth 1-9
  pvPorPersona: number         // avg PV per person
  cvPorPersona: number         // avg CV per person
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Unilevel percentages by level index (0=level 1 through 8=level 9)
const UNILEVEL_PCT = [0.06, 0.08, 0.10, 0.12, 0.05, 0.04, 0.03, 0.02, 0.02]

// Match bonus: simplified percentage based on network depth
// Each entry is [depth, pct] - for depth 1: 25%, depth 2+: based on depth tiers
const MATCH_TABLE: [number, number][] = [
  [1, 0.25],   // direct level: 25%
  [2, 0.10],   // depth 2: 10%
  [3, 0.05],   // depth 3: 5%
]

// ─── Calculation logic ────────────────────────────────────────────────────────

interface BonusBreakdown {
  patrocinio: number    // direct sponsor bonuses
  unilevel: number      // unilevel 9 levels
  match: number         // match bonus
  total: number         // recurring sum
}

function calcBonuses(cfg: SimConfig): BonusBreakdown {
  const { directosPorPersona, nivelesProfundidad, pvPorPersona, cvPorPersona } = cfg

  // ── Patrocinio (sponsor levels 1–3) ──
  // Level 1 = direct sponsors
  const l1cv = directosPorPersona * cvPorPersona
  const l2cv = directosPorPersona * directosPorPersona * cvPorPersona
  const l3cv = directosPorPersona * directosPorPersona * directosPorPersona * cvPorPersona

  const patrocinio = l1cv * 0.20 + l2cv * 0.10 + l3cv * 0.05

  // ── Unilevel (9 levels, capped by network depth) ──
  let unilevel = 0
  for (let d = 1; d <= 9; d++) {
    const count = d <= nivelesProfundidad
      ? Math.pow(directosPorPersona, d)
      : 0
    unilevel += count * pvPorPersona * UNILEVEL_PCT[d - 1]
  }

  // ── Match Bonus (simplified: % of unilevel earnings by depth) ──
  let match = 0
  for (const [depth, pct] of MATCH_TABLE) {
    if (depth <= nivelesProfundidad) {
      const count = Math.pow(directosPorPersona, depth)
      match += count * pvPorPersona * pct * UNILEVEL_PCT[0] // rough est based on level 1 earnings
    }
  }

  const total = patrocinio + unilevel + match

  return {
    patrocinio,
    unilevel,
    match,
    total,
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[13px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', opacity: 0.6 }}
    >
      {children}
    </h2>
  )
}

function InputLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="text-[12px] font-medium mb-1 block"
      style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
    >
      {children}
    </label>
  )
}

const inputCls = `
  w-full rounded-[12px] border border-[#EAECF0] bg-white px-3 py-2.5
  text-[14px] outline-none transition-all
  focus:border-[#0CBCE5] focus:ring-2 focus:ring-[#0CBCE5]/20
`.trim()

function BonusCard({
  icon,
  label,
  amount,
  subtitle,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  amount: number
  subtitle?: string
  highlight?: boolean
}) {
  const isPositive = amount > 0
  return (
    <div
      className="rounded-[16px] p-4 flex items-center gap-3"
      style={{
        background: highlight ? 'linear-gradient(135deg, #062A63 0%, #0a3d8f 100%)' : 'white',
        boxShadow: highlight
          ? '0 4px 20px rgba(6,42,99,0.25)'
          : '0 1px 8px rgba(6,42,99,0.07)',
        border: highlight ? 'none' : '1px solid rgba(234,236,240,0.8)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: highlight
            ? 'rgba(255,255,255,0.15)'
            : isPositive
            ? 'rgba(12,188,229,0.1)'
            : 'rgba(156,163,175,0.1)',
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12px] font-medium truncate"
          style={{
            color: highlight ? 'rgba(255,255,255,0.7)' : '#6B7280',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {label}
        </div>
        {subtitle && (
          <div
            className="text-[10px] mt-0.5 truncate"
            style={{
              color: highlight ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <div
        className="text-[16px] font-bold flex-shrink-0"
        style={{
          color: highlight ? 'white' : isPositive ? '#059669' : '#9CA3AF',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {fmt(amount)}
      </div>
    </div>
  )
}

// ─── Access Denied ─────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F9] p-6">
      <div
        className="rounded-[32px] bg-white shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-8 max-w-sm w-full text-center"
        style={{ border: '1px solid #EAECF0' }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,42,99,0.08)' }}>
          <Lock size={28} color="#062A63" />
        </div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Acceso denegado
        </h2>
        <p
          className="text-sm"
          style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
        >
          Solo los administradores pueden acceder al Simulador de Ganancias.
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SimConfig = {
  directosPorPersona: 3,
  nivelesProfundidad: 4,
  pvPorPersona: 100,
  cvPorPersona: 50,
}

export function SimuladorPage() {
  const { user, loading: authLoading } = useAuth()
  
  // Query ALWAYS at top level - cannot be conditional
  const { data: isAdmin, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      return data?.is_admin === true
    },
    enabled: !!user?.id,
    staleTime: 0,
  })
  
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F9]">
        <div className="w-8 h-8 border-4 border-[#0CBCE5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  
  if (!isAdmin) {
    return <AccessDenied />
  }

  const [cfg, setCfg] = useState<SimConfig>(DEFAULT_CONFIG)

  const bonuses = useMemo(() => calcBonuses(cfg), [cfg])

  function update<K extends keyof SimConfig>(key: K, value: SimConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      className="min-h-screen pb-10"
      style={{ background: '#F9FAFB', fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Header */}
      <div
        className="px-5 pt-16 pb-6"
        style={{
          background: 'linear-gradient(160deg, #062A63 0%, #0e3e8f 100%)',
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(12,188,229,0.2)' }}
          >
            <Calculator size={18} color="#0CBCE5" />
          </div>
          <h1
            className="text-[22px] font-bold text-white"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Simulador de Ganancias
          </h1>
        </div>
        <p className="text-[13px] mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Configura tu red hipotética y estima tus ganancias
        </p>
      </div>

      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto">
        {/* ── Section 1: Config ── */}
        <div
          className="rounded-[20px] p-5 space-y-4"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(6,42,99,0.07)',
            border: '1px solid rgba(234,236,240,0.8)',
          }}
        >
          <SectionTitle>Tu Configuración</SectionTitle>

          {/* Directos por persona */}
          <div>
            <InputLabel>
              Directos por persona
              <span className="ml-1 font-normal text-[#9CA3AF]">(1–10)</span>
            </InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={1}
              max={10}
              value={cfg.directosPorPersona}
              onChange={(e) =>
                update('directosPorPersona', Math.min(10, Math.max(1, Number(e.target.value))))
              }
            />
          </div>

          {/* Niveles de profundidad */}
          <div>
            <InputLabel>
              Niveles de profundidad
              <span className="ml-1 font-normal text-[#9CA3AF]">(1–9)</span>
            </InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={1}
              max={9}
              value={cfg.nivelesProfundidad}
              onChange={(e) =>
                update('nivelesProfundidad', Math.min(9, Math.max(1, Number(e.target.value))))
              }
            />
          </div>

          {/* PV por persona */}
          <div>
            <InputLabel>PV por persona</InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={0}
              value={cfg.pvPorPersona}
              onChange={(e) => update('pvPorPersona', Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* CV por persona */}
          <div>
            <InputLabel>CV por persona</InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={0}
              value={cfg.cvPorPersona}
              onChange={(e) => update('cvPorPersona', Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        {/* ── Section 2: Results ── */}
        <div>
          <SectionTitle>Estimado Mensual</SectionTitle>
          <div className="space-y-2.5">
            <BonusCard
              icon={<Users size={18} color={bonuses.patrocinio > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Bono Patrocinio"
              subtitle="Niveles 1–3 del árbol de patrocinio"
              amount={bonuses.patrocinio}
            />

            <BonusCard
              icon={<Star size={18} color={bonuses.unilevel > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Bono Unilevel"
              subtitle="9 niveles de red unilevel"
              amount={bonuses.unilevel}
            />

            <BonusCard
              icon={<Award size={18} color={bonuses.match > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Bono Match"
              subtitle="Sobre ganancias de red patrocinio"
              amount={bonuses.match}
            />

            {/* Total */}
            <BonusCard
              icon={<Calculator size={18} color="white" />}
              label="TOTAL ESTIMADO"
              subtitle="Suma de bonos mensuales"
              amount={bonuses.total}
              highlight
            />
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div
          className="rounded-[14px] p-4 flex gap-3 items-start"
          style={{
            background: 'rgba(12,188,229,0.06)',
            border: '1px solid rgba(12,188,229,0.2)',
          }}
        >
          <AlertCircle size={16} color="#0CBCE5" className="flex-shrink-0 mt-0.5" />
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: '#4B5563', fontFamily: 'Poppins, sans-serif' }}
          >
            <span className="font-semibold">Estimado ilustrativo.</span> Los resultados reales
            dependen del desempeño de tu red. Los cálculos son aproximaciones basadas en los
            parámetros ingresados y no garantizan ingresos.
          </p>
        </div>
      </div>
    </div>
  )
}