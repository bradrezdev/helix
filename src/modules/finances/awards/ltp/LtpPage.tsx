import { useState, useEffect } from 'react'
import { Plane, CheckCircle2, Lock, Star, Trophy, Users, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth.ts'
import { supabase } from '../../../../lib/supabase.ts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTier(points: number): { tier: number; label: string; color: string; bg: string } {
  if (points >= 200) return { tier: 3, label: 'Tier 3', color: '#059669', bg: '#D1FAE5' }
  if (points >= 100) return { tier: 2, label: 'Tier 2', color: '#0CBCE5', bg: '#E0F9FF' }
  if (points >= 50)  return { tier: 1, label: 'Tier 1', color: '#F59E0B', bg: '#FEF3C7' }
  return { tier: 0, label: 'Sin nivel', color: '#9CA3AF', bg: '#F3F4F6' }
}

function getProgressToNext(points: number): { current: number; next: number; pct: number; label: string } | null {
  if (points < 50)  return { current: points, next: 50,  pct: (points / 50)  * 100, label: 'Tier 1' }
  if (points < 100) return { current: points, next: 100, pct: ((points - 50) / 50) * 100, label: 'Tier 2' }
  if (points < 200) return { current: points, next: 200, pct: ((points - 100) / 100) * 100, label: 'Tier 3' }
  return null
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-[24px] shadow-sm p-5 ${className}`}
      style={{ border: '1px solid #EAECF0' }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wide mb-3"
      style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}
    >
      {children}
    </p>
  )
}

// ─── Current LTP Card ─────────────────────────────────────────────────────────

function LtpSummaryCard({ points, loading }: { points: number; loading: boolean }) {
  const tier = getTier(points)
  const progress = getProgressToNext(points)

  if (loading) {
    return (
      <div
        className="rounded-[24px] p-6"
        style={{ background: 'linear-gradient(135deg, #062A63 0%, #0a3d8f 100%)' }}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-32" />
          <div className="h-12 bg-white/20 rounded w-24" />
          <div className="h-3 bg-white/10 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-[24px] p-6"
      style={{ background: 'linear-gradient(135deg, #062A63 0%, #0a3d8f 100%)' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <Plane size={18} style={{ color: '#0CBCE5' }} />
          </div>
          <span
            className="text-sm font-medium text-white/80"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Mis LTP Points
          </span>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: tier.bg, color: tier.color, fontFamily: 'Poppins, sans-serif' }}
        >
          {tier.label}
        </span>
      </div>

      {/* Points */}
      <p
        className="text-5xl font-bold text-white mb-1"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {points}
      </p>
      <p
        className="text-sm text-white/60 mb-5"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        Leadership Trip Points
      </p>

      {/* Progress bar */}
      {progress ? (
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-white/60" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {progress.current} pts
            </span>
            <span className="text-xs text-white/60" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {progress.next} pts — {progress.label}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(progress.pct, 100)}%`, background: '#0CBCE5' }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Te faltan {progress.next - progress.current} pts para {progress.label}
          </p>
        </div>
      ) : (
        <div className="rounded-[16px] bg-white/10 px-4 py-2 text-sm text-white/80 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Nivel maximo alcanzado — Tier 3
        </div>
      )}
    </div>
  )
}

// ─── Reward Tiers Section ─────────────────────────────────────────────────────

const TIERS = [
  {
    tier: 1,
    range: '50–99 pts',
    min: 50,
    title: 'Tier 1',
    description: 'Socio + 1 invitado asisten al viaje',
    detail: 'Costo propio — transporte y hotel por cuenta del socio',
    icon: Star,
  },
  {
    tier: 2,
    range: '100–199 pts',
    min: 100,
    title: 'Tier 2',
    description: 'Socio + 1 invitado, hotel all-inclusive pagado',
    detail: 'Helix paga el hotel all-inclusive para ambos',
    icon: Trophy,
  },
  {
    tier: 3,
    range: '200+ pts',
    min: 200,
    title: 'Tier 3',
    description: 'Socio + 1 invitado, hotel + vuelos pagados',
    detail: 'Helix paga hotel all-inclusive y vuelos de ida y vuelta',
    icon: Plane,
  },
]

function RewardTiersCard({ points }: { points: number }) {
  return (
    <Card>
      <SectionLabel>Niveles de Recompensa</SectionLabel>
      <div className="space-y-3">
        {TIERS.map(({ tier, range, min, title, description, detail, icon: Icon }) => {
          const unlocked = points >= min
          return (
            <div
              key={tier}
              className="rounded-[16px] p-4 flex items-start gap-3"
              style={{
                background: unlocked ? '#F0FDFA' : '#F8FAFC',
                border: `1px solid ${unlocked ? '#A7F3D0' : '#EAECF0'}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: unlocked ? '#D1FAE5' : '#F3F4F6' }}
              >
                <Icon size={17} style={{ color: unlocked ? '#059669' : '#9CA3AF' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: unlocked ? '#062A63' : '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {title} — {range}
                  </span>
                  {unlocked ? (
                    <CheckCircle2 size={15} style={{ color: '#059669' }} />
                  ) : (
                    <Lock size={13} style={{ color: '#D1D5DB' }} />
                  )}
                </div>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: unlocked ? '#374151' : '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
                >
                  {description}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: unlocked ? '#6B7280' : '#C4C9D4', fontFamily: 'Poppins, sans-serif' }}
                >
                  {detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── How to Earn Section ──────────────────────────────────────────────────────

const EARN_WAYS = [
  {
    icon: Users,
    label: 'Inscribe directo con Kit Basico',
    pts: '+1 LTP',
  },
  {
    icon: Users,
    label: 'Inscribe directo con Kit Intermedio',
    pts: '+2 LTP',
  },
  {
    icon: Users,
    label: 'Inscribe directo con Kit Superior',
    pts: '+4 LTP',
    bonus: '+10 bonus por cada 5 kit superior directos en el mismo mes',
  },
  {
    icon: TrendingUp,
    label: 'Bono Promotor adquirido personalmente',
    pts: '+4 LTP',
    bonus: '+10 bonus por cada 5 en el mismo mes',
  },
  {
    icon: Trophy,
    label: 'Avance de rango propio (solo nuevo maximo)',
    pts: 'Bronce +5 / Plata +10 / Oro +20 / Platino +30 / Diamante+ +50',
  },
  {
    icon: Star,
    label: 'Avance de rango de directo',
    pts: 'Bronce +1 / Plata +3 / Oro +5 / Platino +10 / Diamante+ +25',
  },
]

function HowToEarnCard() {
  return (
    <Card>
      <SectionLabel>Como Ganar LTP Points</SectionLabel>
      <div className="space-y-2">
        {EARN_WAYS.map(({ icon: Icon, label, pts, bonus }, i) => (
          <div
            key={i}
            className="rounded-[14px] p-3 flex items-start gap-3"
            style={{ background: '#F8FAFC', border: '1px solid #EAECF0' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: '#EFF6FF' }}
            >
              <Icon size={15} style={{ color: '#062A63' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {label}
              </p>
              <p
                className="text-xs mt-0.5 font-semibold"
                style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
              >
                {pts}
              </p>
              {bonus && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
                >
                  {bonus}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Period Info ──────────────────────────────────────────────────────────────

function PeriodInfoCard() {
  return (
    <div
      className="rounded-[16px] p-4 flex items-center gap-3"
      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
    >
      <Calendar size={18} style={{ color: '#062A63' }} />
      <div>
        <p
          className="text-xs font-semibold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Periodo de acumulacion
        </p>
        <p
          className="text-xs text-blue-600 mt-0.5"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          6 meses — Los puntos se acumulan en periodos semestrales
        </p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function LtpPage() {
  const { user } = useAuth()
  const [ltpPoints, setLtpPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    async function fetchLtp() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('ltp_points')
          .eq('id', user.id)
          .single()
        if (error) throw error
        setLtpPoints(Number(data?.ltp_points ?? 0))
      } catch {
        setLtpPoints(0)
      } finally {
        setLoading(false)
      }
    }
    fetchLtp()
  }, [user?.id])

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Viaje de Liderazgo
        </h1>
        <p
          className="text-sm text-gray-500 mt-1"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Leadership Trip Points
        </p>
      </div>

      {/* Content */}
      <div className="px-5 space-y-5">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#062A63' }} />
          </div>
        ) : (
          <>
            <LtpSummaryCard points={ltpPoints} loading={false} />
            <RewardTiersCard points={ltpPoints} />
            <HowToEarnCard />
            <PeriodInfoCard />
          </>
        )}
      </div>
    </div>
  )
}
