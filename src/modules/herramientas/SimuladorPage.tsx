import { useState, useMemo } from 'react'
import { Calculator, TrendingUp, Users, Award, Infinity, Star, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Rank =
  | 'Socio'
  | 'Bronce'
  | 'Plata'
  | 'Oro'
  | 'Platino'
  | 'Diamante'
  | 'Doble Diamante'
  | 'Triple Diamante'
  | 'Diamante Embajador'
  | 'Doble Diamante Embajador'
  | 'Triple Diamante Embajador'

interface SimConfig {
  rank: Rank
  pvPersonal: number
  directCount: number
  pvPerDirect: number
  networkDepth: number
  perLevel: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RANKS: Rank[] = [
  'Socio',
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

const DIFERENCIAL_PCT: Partial<Record<Rank, number>> = {
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

const UNILEVEL_PCT = [0.06, 0.08, 0.10, 0.12, 0.05, 0.04, 0.03, 0.02, 0.02]

const INFINITO_UNILEVEL_PCT: Partial<Record<Rank, number>> = {
  Platino: 0.005,
  Diamante: 0.0075,
  'Doble Diamante': 0.01,
  'Triple Diamante': 0.0125,
  'Diamante Embajador': 0.015,
  'Doble Diamante Embajador': 0.0175,
  'Triple Diamante Embajador': 0.02,
}

const MATCH_PCTS: Partial<Record<Rank, number[]>> = {
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

const AVANCE_RANGO: Partial<Record<Rank, number>> = {
  Bronce: 100,
  Plata: 150,
  Oro: 200,
  Platino: 250,
  Diamante: 500,
  'Doble Diamante': 1000,
  'Triple Diamante': 2500,
  'Diamante Embajador': 5000,
  'Doble Diamante Embajador': 10000,
  'Triple Diamante Embajador': 25000,
}

// ─── Calculation logic ────────────────────────────────────────────────────────

interface BonusBreakdown {
  patrocinio: number       // direct sponsor 20%+10%+5%
  diferencial: number      // differential on depth 4+
  unilevel: number         // 9 levels
  match: number            // match on unilevel earnings
  infinitoPatrocinio: number  // sponsor tree depth 4+ (same as diferencial, separate label)
  infinitoUnilevel: number // depth 10+
  avanceRango: number      // one-time
  total: number            // recurring sum (excl. avance)
}

function calcBonuses(cfg: SimConfig): BonusBreakdown {
  const { rank, pvPersonal: _pvPersonal, directCount, pvPerDirect, networkDepth, perLevel } = cfg

  // Helpers
  const countAtDepth = (d: number) => Math.pow(perLevel, d) // sponsor tree same as unilevel tree in simulation

  // ── Bono Patrocinio (sponsor levels 1–3) ──
  // Level 1 = direct sponsors
  const l1cv = directCount * pvPerDirect
  const l2cv = countAtDepth(2) * pvPerDirect
  const l3cv = countAtDepth(3) * pvPerDirect

  const directSponsor = l1cv * 0.20 + l2cv * 0.10 + l3cv * 0.05

  // ── Diferencial Patrocinio (ranks Bronce+, depth 4+) ──
  // Since downline assumed Socio (0%), we collect full rank%
  const diferPct = DIFERENCIAL_PCT[rank] ?? 0
  let diferencial = 0
  if (diferPct > 0) {
    for (let d = 4; d <= Math.max(networkDepth, 4); d++) {
      diferencial += countAtDepth(d) * pvPerDirect * diferPct
    }
    // If networkDepth < 4, no diferencial
    if (networkDepth < 4) diferencial = 0
  }

  // ── Unilevel (9 levels) ──
  let unilevel = 0
  const uniPerPerson: number[] = []
  for (let d = 1; d <= 9; d++) {
    const count = d <= networkDepth ? countAtDepth(d) : 0
    const earning = count * pvPerDirect * UNILEVEL_PCT[d - 1]
    uniPerPerson.push(count > 0 ? pvPerDirect * UNILEVEL_PCT[d - 1] : 0)
    unilevel += earning
  }

  // ── Match Bonus ──
  // On unilevel earnings of sponsor-tree downline (levels 1–5 of sponsor tree)
  const matchPcts = MATCH_PCTS[rank] ?? []
  let match = 0
  const avgUniPerPerson = uniPerPerson.length > 0
    ? uniPerPerson.reduce((a, b) => a + b, 0) / 9
    : 0

  for (let lvl = 1; lvl <= matchPcts.length; lvl++) {
    const count = lvl <= networkDepth ? countAtDepth(lvl) : (lvl === 1 ? directCount : 0)
    // estimated unilevel per person at this sponsor level
    const estUnilevel = avgUniPerPerson * 9 // rough: each person earns ~same avg
    match += count * estUnilevel * matchPcts[lvl - 1]
  }

  // ── Infinito Patrocinio ──
  // Same as diferencial in this simulation (sponsor tree depth 4+)
  const infinitoPatrocinio = diferencial

  // ── Infinito Unilevel (depth 10+, Platino+) ──
  const infUniPct = INFINITO_UNILEVEL_PCT[rank] ?? 0
  let infinitoUnilevel = 0
  if (infUniPct > 0 && networkDepth >= 10) {
    // Cap at depth 15 to avoid astronomical numbers
    const maxDepth = Math.min(networkDepth, 15)
    for (let d = 10; d <= maxDepth; d++) {
      infinitoUnilevel += countAtDepth(d) * pvPerDirect * infUniPct
    }
  }

  // ── Avance de Rango ──
  const avanceRango = AVANCE_RANGO[rank] ?? 0

  // ── Total (recurring only) ──
  const total = directSponsor + diferencial + unilevel + match + infinitoUnilevel

  return {
    patrocinio: directSponsor,
    diferencial,
    unilevel,
    match,
    infinitoPatrocinio,
    infinitoUnilevel,
    avanceRango,
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

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SimConfig = {
  rank: 'Socio',
  pvPersonal: 100,
  directCount: 3,
  pvPerDirect: 100,
  networkDepth: 4,
  perLevel: 3,
}

export function SimuladorPage() {
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

          {/* Rank */}
          <div>
            <InputLabel>Tu Rango</InputLabel>
            <select
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              value={cfg.rank}
              onChange={(e) => update('rank', e.target.value as Rank)}
            >
              {RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* PV Personal */}
          <div>
            <InputLabel>PV Personal</InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={0}
              value={cfg.pvPersonal}
              onChange={(e) => update('pvPersonal', Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* Direct count */}
          <div>
            <InputLabel>
              Número de patrocinados directos
              <span className="ml-1 font-normal text-[#9CA3AF]">(1–10)</span>
            </InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={1}
              max={10}
              value={cfg.directCount}
              onChange={(e) =>
                update('directCount', Math.min(10, Math.max(1, Number(e.target.value))))
              }
            />
          </div>

          {/* PV per direct */}
          <div>
            <InputLabel>PV promedio por patrocinado directo</InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={0}
              value={cfg.pvPerDirect}
              onChange={(e) => update('pvPerDirect', Math.max(0, Number(e.target.value)))}
            />
          </div>

          {/* Network depth */}
          <div>
            <InputLabel>
              Profundidad de red unilevel
              <span className="ml-1 font-normal text-[#9CA3AF]">(niveles 1–9)</span>
            </InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={1}
              max={9}
              value={cfg.networkDepth}
              onChange={(e) =>
                update('networkDepth', Math.min(9, Math.max(1, Number(e.target.value))))
              }
            />
          </div>

          {/* Per level */}
          <div>
            <InputLabel>Personas por nivel</InputLabel>
            <input
              type="number"
              className={inputCls}
              style={{ fontFamily: 'Poppins, sans-serif', color: '#062A63' }}
              min={1}
              value={cfg.perLevel}
              onChange={(e) => update('perLevel', Math.max(1, Number(e.target.value)))}
            />
            <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>
              Mismo número en cada nivel de profundidad
            </p>
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
              icon={<TrendingUp size={18} color={bonuses.diferencial > 0 ? '#0CBCE5' : '#9CA3AF'} />}
              label="Diferencial Patrocinio"
              subtitle="Nivel 4+ · Bronce o superior"
              amount={bonuses.diferencial}
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
              subtitle="Sobre ganancias unilevel de tu red patrocinio"
              amount={bonuses.match}
            />

            <BonusCard
              icon={
                <Infinity size={18} color={bonuses.infinitoUnilevel > 0 ? '#0CBCE5' : '#9CA3AF'} />
              }
              label="Bono Infinito Unilevel"
              subtitle="Profundidad 10+ · Platino o superior"
              amount={bonuses.infinitoUnilevel}
            />

            {/* Total */}
            <BonusCard
              icon={<Calculator size={18} color="white" />}
              label="TOTAL RECURRENTE"
              subtitle="Suma de bonos mensuales"
              amount={bonuses.total}
              highlight
            />
          </div>
        </div>

        {/* ── One-time bonus ── */}
        <div>
          <SectionTitle>Bono de Avance de Rango</SectionTitle>
          <div
            className="rounded-[16px] p-4 flex items-center gap-3"
            style={{
              background: 'white',
              boxShadow: '0 1px 8px rgba(6,42,99,0.07)',
              border: '1px solid rgba(234,236,240,0.8)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  bonuses.avanceRango > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(156,163,175,0.1)',
              }}
            >
              <Award size={18} color={bonuses.avanceRango > 0 ? '#D97706' : '#9CA3AF'} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[12px] font-medium"
                style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
              >
                Bono Avance de Rango
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
              >
                Pago único al calificar al rango actual
              </div>
            </div>
            <div
              className="text-[16px] font-bold flex-shrink-0"
              style={{
                color: bonuses.avanceRango > 0 ? '#D97706' : '#9CA3AF',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {fmt(bonuses.avanceRango)}
            </div>
          </div>
          <p
            className="text-[11px] mt-2 px-1"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            * Este bono se paga una sola vez al calificar al rango. No es recurrente.
          </p>
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
