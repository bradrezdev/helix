import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calculator, TrendingUp, Users, Award, Infinity, Star, AlertCircle, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SimConfig {
  directosPorPersona: number    // direct sponsors per person
  nivelesProfundidad: number  // network depth
  pvPorPersona: number      // avg PV per person
  cvPorPersona: number    // avg CV per person
}

type Rank = 'Bronce' | 'Plata' | 'Oro' | 'Platino' | 'Diamante' | 'Doble Diamante' | 'Triple Diamante' | 'Diamante Embajador' | 'Doble Diamante Embajador' | 'Triple Diamante Embajador'

// ─── Constants ────────────────────────────────────────────────────────────────

// Rank requirements: [personal VG, group VG] - based on VG total in organization
const RANK_REQUIREMENTS: Record<Rank, [number, number]> = {
  Bronce: [0, 1000],
  Plata: [0, 3000],
  Oro: [0, 5000],
  Platino: [0, 10000],
  Diamante: [0, 25000],
  'Doble Diamante': [0, 50000],
  'Triple Diamante': [0, 100000],
  'Diamante Embajador': [0, 250000],
  'Doble Diamante Embajador': [0, 500000],
  'Triple Diamante Embajador': [0, 1000000],
}

// Get rank options ordered from lowest to highest
const RANK_OPTIONS: Rank[] = [
  'Bronce',
  'Plata',
  'Oro',
  'Platino',
  'Diamante',
  'Doble Diamante',
  'Triple Diamante',
  'Diamante Embajador',
  'Doble Diamante Embajador',
  'Triple Diamante Embajador',
]

// Calculate achievable rank based on network VG
function calculateAchievableRank(vgTotal: number): Rank {
  let achievable: Rank = 'Bronce'
  for (const rank of RANK_OPTIONS) {
    const [, groupVG] = RANK_REQUIREMENTS[rank]
    if (vgTotal >= groupVG) {
      achievable = rank
    }
  }
  return achievable
}

// Unilevel percentages by level index (0=level 1 through 8=level 9)
const UNILEVEL_PCT = [0.06, 0.08, 0.10, 0.12, 0.05, 0.04, 0.03, 0.02, 0.02]

// Bono Patrocinio by level: L1=25%, L2=15%, L3=5%
const PATROCINIO_PCT = { L1: 0.25, L2: 0.15, L3: 0.05 }

// Match bonus by rank: pct_n1 through pct_n5
const MATCH_BONUS: Record<Rank, number[]> = {
  Bronce: [],
  Plata: [0.05],
  Oro: [0.10],
  Platino: [0.15],
  Diamante: [0.25, 0.05],
  'Doble Diamante': [0.25, 0.10, 0.10],
  'Triple Diamante': [0.25, 0.15, 0.10, 0.05],
  'Diamante Embajador': [0.25, 0.15, 0.10, 0.05, 0.01],
  'Doble Diamante Embajador': [0.25, 0.15, 0.10, 0.05, 0.03],
  'Triple Diamante Embajador': [0.25, 0.15, 0.10, 0.05, 0.05],
}

// Infinito Patrocinio by rank (levels 4+ in sponsor tree)
const INFINITO_PATROCINIO: Record<Rank, number> = {
  Bronce: 0.06,
  Plata: 0.07,
  Oro: 0.08,
  Platino: 0.09,
  Diamante: 0.10,
  'Doble Diamante': 0.11,
  'Triple Diamante': 0.12,
  'Diamante Embajador': 0.13,
  'Doble Diamante Embajador': 0.14,
  'Triple Diamante Embajador': 0.15,
}

// Infinito Uninivel (level 10+) by rank
const INFINITO_UNILEVEL: Record<Rank, number> = {
  Bronce: 0,
  Plata: 0,
  Oro: 0,
  Platino: 0.005,
  Diamante: 0.0075,
  'Doble Diamante': 0.01,
  'Triple Diamante': 0.0125,
  'Diamante Embajador': 0.015,
  'Doble Diamante Embajador': 0.0175,
  'Triple Diamante Embajador': 0.02,
}

// ─── Calculation logic ────────────────────────────────────────────────────────────────

interface BonoBreakdown {
  network: number
  vgTotal: number
  rango: Rank
  patrocinio: { level1: number; level2: number; level3: number; total: number }
  infinitoPatrocinio: number
  unilevel: { level: number; personas: number; pv: number; cv: number; bono: number; pct: number }[]
  unilevelTotal: number
  infinitoUnilevel: number
  match: { level: number; personas: number; unilevelEarnings: number; bono: number; pct: number }[]
  matchTotal: number
  teamStructure: { level: number; personas: number; pv: number; cv: number; vg: number; cvg: number }[]
  total: number
}

function calcBonuses(cfg: SimConfig): BonoBreakdown {
  const { directosPorPersona, nivelesProfundidad, pvPorPersona, cvPorPersona } = cfg

  // ── Network & VG ──
  // Geometric series:directos^1 + directos^2 + ... + directos^n
  const levels = Math.min(nivelesProfundidad, 9)
  let network = 0
  const levelCounts: number[] = []
  for (let l = 1; l <= levels; l++) {
    const count = Math.pow(directosPorPersona, l)
    levelCounts.push(count)
    network += count
  }

  const vgTotal = network * cvPorPersona // group volume = total CV in network

  // Calculate achievable rank based on VG
  const rango = calculateAchievableRank(vgTotal)

  // ── Bono Patrocinio (sponsor levels 1-3) ──
  const l1Cv = levelCounts[0] || 0
  const l2Cv = levelCounts[1] || 0
  const l3Cv = levelCounts[2] || 0

  const patrocinio = {
    level1: l1Cv * cvPorPersona * PATROCINIO_PCT.L1,
    level2: l2Cv * cvPorPersona * PATROCINIO_PCT.L2,
    level3: l3Cv * cvPorPersona * PATROCINIO_PCT.L3,
    total: 0,
  }
  patrocinio.total = patrocinio.level1 + patrocinio.level2 + patrocinio.level3

  // ── Bono Infinito Patrocinio (sponsor levels 4+) ──
  const infPatrocinioRank = INFINITO_PATROCINIO[rango]
  let infPatrocinio = 0
  for (let l = 4; l <= Math.min(levels, 9); l++) {
    const idx = l - 1
    if (levelCounts[idx]) {
      infPatrocinio += levelCounts[idx] * cvPorPersona * infPatrocinioRank
    }
  }

  // ── Bono Uninivel (levels 1-9) ──
  const unilevel: BonoBreakdown['unilevel'] = []
  let unilevelTotal = 0
  for (let l = 1; l <= levels; l++) {
    const personas = levelCounts[l - 1] || 0
    const pv = personas * pvPorPersona
    const cv = personas * cvPorPersona
    const bono = pv * UNILEVEL_PCT[l - 1]
    unilevel.push({
      level: l,
      personas,
      pv,
      cv,
      bono,
      pct: UNILEVEL_PCT[l - 1] * 100,
    })
    unilevelTotal += bono
  }

  // ── Bono Infinito Uninivel (level 10+) ──
  // For simulation, treat nivel 10+ as nivel 10
  const infUnilevelPct = INFINITO_UNILEVEL[rango] || 0
  const infinitoUnilevel = levelCounts.reduce((sum, count, idx) => {
    if (idx >= 10) return sum + count * pvPorPersona * infUnilevelPct
    return sum
  }, 0)

  // ── Bono Match (by rank on SPONSOR TREE, using unilevel percentages)
  // For each sponsor tree level (1-5), calculate what unilevel bonus would be
  // using a weighted average of unilevel percentages across depths
  const matchPcts = MATCH_BONUS[rango]
  const match: BonoBreakdown['match'] = []
  let matchTotal = 0

  // Average unilevel percentage across all 9 levels (for estimating unilevel earnings at each sponsor level)
  const avgUnilevelPct = UNILEVEL_PCT.reduce((a, b) => a + b, 0) / UNILEVEL_PCT.length

  // Match applies to unilevel earnings that people at each sponsor level WOULD generate
  // Using average unilevel percentage since we can't know each person's exact unilevel depth
  for (let l = 1; l <= Math.min(levels, 5); l++) {
    const personas = levelCounts[l - 1] || 0
    if (personas > 0) {
      const pct = matchPcts[l - 1] || 0
      if (pct > 0) {
        // Each person at sponsor level l has pvPorPersona
        // Their unilevel earnings = pvPorPersona × avgUnilevelPct
        const unilevelEarnings = personas * pvPorPersona * avgUnilevelPct
        // Match = unilevel earnings × rank percentage at this sponsor level
        const bono = unilevelEarnings * pct
        match.push({
          level: l,
          personas,
          unilevelEarnings,
          bono,
          pct: pct * 100,
        })
        matchTotal += bono
      }
    }
  }

  // ── Team Structure Table ──
  const teamStructure: BonoBreakdown['teamStructure'] = []
  let cvgAccum = 0
  for (let l = 1; l <= levels; l++) {
    const personas = levelCounts[l - 1] || 0
    const pv = personas * pvPorPersona
    const cv = personas * cvPorPersona
    cvgAccum += cv
    teamStructure.push({
      level: l,
      personas,
      pv,
      cv,
      vg: personas > 0 ? cvPorPersona : 0, // per person
      cvg: cvgAccum, // cumulative VG
    })
  }

  // ── Total ──
  const total = patrocinio.total + infPatrocinio + unilevelTotal + infinitoUnilevel + matchTotal

  return {
    network,
    vgTotal,
    rango,
    patrocinio,
    infinitoPatrocinio: infPatrocinio,
    unilevel,
    unilevelTotal,
    infinitoUnilevel,
    match,
    matchTotal,
    teamStructure,
    total,
  }
}

// ─── Formatting ─────────────────────────────────────────────────────────────────

function fmt(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

function fmtNum(val: number): string {
  return new Intl.NumberFormat('en-US').format(val)
}

// ─── Sub-components ───────────────────────────────────────��───────────────────────────

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

function DataRow({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string | number
  bold?: boolean
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#F3F4F6] last:border-0">
      <span
        className={`text-[12px] ${bold ? 'font-semibold' : 'font-normal'}`}
        style={{ color: '#374151', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      <span
        className={`text-[12px] ${bold ? 'font-semibold' : 'font-medium'}`}
        style={{ color: bold ? '#062A63' : '#4B5563', fontFamily: 'Poppins, sans-serif' }}
      >
        {typeof value === 'number' ? fmtNum(value) : value}
      </span>
    </div>
  )
}

function TableRow({
  cells,
  bold = false,
}: {
  cells: (string | number)[]
  bold?: boolean
}) {
  return (
    <div
      className={`grid gap-2 py-2 px-3 ${bold ? 'bg-[#F8FAFC] rounded-lg' : ''}`}
      style={{
        gridTemplateColumns: '60px 70px 80px 80px 80px 70px',
      }}
    >
      {cells.map((cell, i) => (
        <span
          key={i}
          className={`text-[11px] ${bold ? 'font-semibold' : 'font-normal'} truncate`}
          style={{
            color: i === 0 ? '#374151' : '#4B5563',
            fontFamily: 'Poppins, sans-serif',
            textAlign: i > 0 ? 'right' : 'left',
          }}
        >
          {typeof cell === 'number' ? (i <= 4 ? fmtNum(cell) : `${cell}%`) : cell}
        </span>
      ))}
    </div>
  )
}

function TableHeader() {
  return (
    <div
      className="grid gap-2 py-2 px-3 rounded-t-lg"
      style={{
        gridTemplateColumns: '60px 70px 80px 80px 80px 70px',
        background: '#062A63',
      }}
    >
      {['Nivel', 'Personas', 'PV', 'CV', 'Bono', '%'].map((h) => (
        <span
          key={h}
          className="text-[10px] font-semibold uppercase"
          style={{ color: 'white', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}
        >
          {h}
        </span>
      ))}
    </div>
  )
}

function TableHeaderWide() {
  return (
    <div
      className="grid gap-2 py-2 px-3 rounded-t-lg"
      style={{
        gridTemplateColumns: '50px 70px 80px 80px 80px 80px',
        background: '#062A63',
      }}
    >
      {['Nivel', 'Personas', 'PV', 'CV', 'VG', 'CVG'].map((h) => (
        <span
          key={h}
          className="text-[10px] font-semibold uppercase"
          style={{ color: 'white', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}
        >
          {h}
        </span>
      ))}
    </div>
  )
}

function MatchTableHeader() {
  return (
    <div
      className="grid gap-2 py-2 px-3 rounded-t-lg"
      style={{
        gridTemplateColumns: '60px 70px 100px 80px 70px',
        background: '#062A63',
      }}
    >
      {['Nivel', 'Personas', 'Unilevel', 'Bono', '%'].map((h) => (
        <span
          key={h}
          className="text-[10px] font-semibold uppercase"
          style={{ color: 'white', fontFamily: 'Poppins, sans-serif', textAlign: 'center' }}
        >
          {h}
        </span>
      ))}
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

export function SimuladorPage() {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
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

  // State and memo here, after all hooks are called
  const [cfg, setCfg] = useState<SimConfig>({
    directosPorPersona: 3,
    nivelesProfundidad: 4,
    pvPorPersona: 100,
    cvPorPersona: 50,
  })
  const bonuses = useMemo(() => calcBonuses(cfg), [cfg])

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    patrocinio: true,
    unilevel: true,
    match: false,
    team: false,
  })

  function update<K extends keyof SimConfig>(key: K, value: SimConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSection(section: string) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // NOW we can do conditional returns
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
                update('directosPorPersona', Math.min(10, Math.max(1, Number(e.target.value) || 0)))
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
                update('nivelesProfundidad', Math.min(9, Math.max(1, Number(e.target.value) || 0)))
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
              onChange={(e) => update('pvPorPersona', Math.max(0, Number(e.target.value) || 0))}
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
              onChange={(e) => update('cvPorPersona', Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </div>

        {/* ── Section 2: Results ── */}
        <div>
          <SectionTitle>Resumen de Ganancias</SectionTitle>
          <div className="space-y-2.5">
            <BonusCard
              icon={<Users size={18} color={bonuses.patrocinio.total > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Bono Patrocinio"
              subtitle="Niveles 1–3 del árbol de patrocinio"
              amount={bonuses.patrocinio.total}
            />

            <BonusCard
              icon={<Star size={18} color={bonuses.unilevelTotal > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Bono Unilevel"
              subtitle="9 niveles de red unilevel"
              amount={bonuses.unilevelTotal}
            />

            <BonusCard
              icon={<Award size={18} color={bonuses.matchTotal > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Bono Match"
              subtitle="Sobre ganancias unilevel"
              amount={bonuses.matchTotal}
            />

            <BonusCard
              icon={<Infinity size={18} color="#0CBCE5" />}
              label="Bono Infinito Patrocinio"
              subtitle="Niveles 4+ en árbol de patrocinio"
              amount={bonuses.infinitoPatrocinio}
            />

            <BonusCard
              icon={<TrendingUp size={18} color="#0CBCE5" />}
              label="Bono Infinito Uninivel"
              subtitle="Nivel 10+ unilevel"
              amount={bonuses.infinitoUnilevel}
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

        {/* ── Section 3: Network Summary ── */}
        <div
          className="rounded-[20px] p-5"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(6,42,99,0.07)',
            border: '1px solid rgba(234,236,240,0.8)',
          }}
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('summary')}
          >
            <SectionTitle>Resumen de Red</SectionTitle>
            {expandedSections.summary ? (
              <ChevronUp size={16} color="#062A63" />
            ) : (
              <ChevronDown size={16} color="#062A63" />
            )}
          </div>

          {expandedSections.summary && (
            <div className="space-y-1">
              <DataRow label="Total personas en la red" value={bonuses.network} bold />
              <DataRow label="VG Total (Group Volume)" value={bonuses.vgTotal} bold />
              <DataRow label="Rango alcanzado" value={bonuses.rango} bold />
            </div>
          )}
        </div>

        {/* ── Section 4: Bono Patrocinio Detail ── */}
        <div
          className="rounded-[20px] p-5"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(6,42,99,0.07)',
            border: '1px solid rgba(234,236,240,0.8)',
          }}
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('patrocinio')}
          >
            <SectionTitle>Detalle Bono Patrocinio</SectionTitle>
            {expandedSections.patrocinio ? (
              <ChevronUp size={16} color="#062A63" />
            ) : (
              <ChevronDown size={16} color="#062A63" />
            )}
          </div>

          {expandedSections.patrocinio && (
            <div className="space-y-1">
              <DataRow label="Nivel 1 (25%)" value={bonuses.patrocinio.level1} />
              <DataRow label="Nivel 2 (15%)" value={bonuses.patrocinio.level2} />
              <DataRow label="Nivel 3 (5%)" value={bonuses.patrocinio.level3} />
              <DataRow label="Total" value={bonuses.patrocinio.total} bold />
            </div>
          )}
        </div>

        {/* ── Section 5: Bono Uninivel Detail ── */}
        <div
          className="rounded-[20px] p-5"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(6,42,99,0.07)',
            border: '1px solid rgba(234,236,240,0.8)',
          }}
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('unilevel')}
          >
            <SectionTitle>Detalle Bono Uninivel</SectionTitle>
            {expandedSections.unilevel ? (
              <ChevronUp size={16} color="#062A63" />
            ) : (
              <ChevronDown size={16} color="#062A63" />
            )}
          </div>

          {expandedSections.unilevel && (
            <>
              <TableHeader />
              {bonuses.unilevel.map((row) => (
                <TableRow
                  key={row.level}
                  cells={[row.level, row.personas, row.pv, row.cv, row.bono, row.pct]}
                />
              ))}
              <div className="flex justify-between py-2 px-3 mt-2 rounded-lg bg-[#F8FAFC]">
                <span className="text-[12px] font-semibold" style={{ color: '#062A63' }}>
                  Total
                </span>
                <span className="text-[12px] font-semibold" style={{ color: '#059669' }}>
                  {fmt(bonuses.unilevelTotal)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Section 6: Bono Match Detail ── */}
        <div
          className="rounded-[20px] p-5"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(6,42,99,0.07)',
            border: '1px solid rgba(234,236,240,0.8)',
          }}
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('match')}
          >
            <SectionTitle>Detalle Bono Match</SectionTitle>
            {expandedSections.match ? (
              <ChevronUp size={16} color="#062A63" />
            ) : (
              <ChevronDown size={16} color="#062A63" />
            )}
          </div>

          {expandedSections.match && (
            <>
              <MatchTableHeader />
              {bonuses.match.map((row) => (
                <TableRow key={row.level} cells={[row.level, row.personas, row.unilevelEarnings, row.bono, row.pct]} />
              ))}
              <div className="flex justify-between py-2 px-3 mt-2 rounded-lg bg-[#F8FAFC]">
                <span className="text-[12px] font-semibold" style={{ color: '#062A63' }}>
                  Total
                </span>
                <span className="text-[12px] font-semibold" style={{ color: '#059669' }}>
                  {fmt(bonuses.matchTotal)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Section 7: Team Structure ── */}
        <div
          className="rounded-[20px] p-5"
          style={{
            background: 'white',
            boxShadow: '0 2px 16px rgba(6,42,99,0.07)',
            border: '1px solid rgba(234,236,240,0.8)',
          }}
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection('team')}
          >
            <SectionTitle>Estructura de Equipo</SectionTitle>
            {expandedSections.team ? (
              <ChevronUp size={16} color="#062A63" />
            ) : (
              <ChevronDown size={16} color="#062A63" />
            )}
          </div>

          {expandedSections.team && (
            <>
              <TableHeaderWide />
              {bonuses.teamStructure.map((row) => (
                <TableRow
                  key={row.level}
                  cells={[row.level, row.personas, row.pv, row.cv, row.vg, row.cvg]}
                />
              ))}
            </>
          )}
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
            parámetros ingresados y no garantiza ingresos.
          </p>
        </div>
      </div>
    </div>
  )
}