import { useState } from 'react'
import { ChevronDown, Users, Activity, Layers, ArrowRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../hooks/useAuth'
import { useNetworkStats, useRecentUsers, useCommissionHistory } from '../../hooks/useNegocio'
import type { CommissionStatus, CommissionRow, RecentUser } from '../../hooks/useNegocio'
import { useDashboard } from '../../hooks/useDashboard'
import { cn } from '../../lib/utils'
import { HoldingTankSection } from './HoldingTankSection'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<CommissionStatus, { bg: string; text: string; label: string }> = {
  pagado:     { bg: 'bg-emerald-50',  text: 'text-emerald-600',  label: 'Pagado' },
  pendiente:  { bg: 'bg-yellow-50',   text: 'text-yellow-600',   label: 'Pendiente' },
  procesando: { bg: 'bg-blue-50',     text: 'text-blue-600',     label: 'Procesando' },
}

function StatusBadge({ status }: { status: CommissionStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', s.bg, s.text)}>
      {s.label}
    </span>
  )
}

// ─── Section wrapper (accordion) ───────────────────────────────────────────────

interface SectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: string
}

function Section({ title, defaultOpen = false, children, badge }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-white rounded-[32px] border border-[#EAECF0] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-base font-semibold text-[#062A63]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {title}
          </span>
          {badge && (
            <span className="text-xs font-medium bg-[#EFF6FF] text-[#062A63] px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn('text-gray-400 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          open ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
        style={open ? {} : { maxHeight: 0 }}
      >
        <div className="border-t border-[#EAECF0]">{children}</div>
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-sm text-gray-400 px-5">
      <span className="text-2xl">[MAIL]</span>
      <p>{message}</p>
    </div>
  )
}

// ─── Mi Red section ───────────────────────────────────────────────────────────

function MiRedSection({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useNetworkStats(userId)

  return (
    <Section title="Mi Red">
      {isLoading ? (
        <Spinner />
      ) : !stats ? (
        <EmptyState message="No hay datos de red disponibles" />
      ) : (
        <div className="px-5 py-4 space-y-4">
          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#F8FAFF] p-3 border border-[#EAECF0]">
              <Users size={18} className="text-[#062A63]" />
              <span className="text-xl font-semibold text-[#062A63]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.unilevel_total}
              </span>
              <span className="text-[11px] text-gray-400 text-center leading-tight">Total distribuidores</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#F8FAFF] p-3 border border-[#EAECF0]">
              <Activity size={18} className="text-emerald-500" />
              <span className="text-xl font-semibold text-[#062A63]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.active_count}
              </span>
              <span className="text-[11px] text-gray-400 text-center leading-tight">Activos</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-[#F8FAFF] p-3 border border-[#EAECF0]">
              <Layers size={18} className="text-[#0CBCE5]" />
              <span className="text-xl font-semibold text-[#062A63]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.unilevel_directs}
              </span>
              <span className="text-[11px] text-gray-400 text-center leading-tight">Directos</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate({ to: '/network' })}
            className="w-full flex items-center justify-between px-4 py-3 rounded-full border border-[#EAECF0] hover:bg-[#F8FAFF] transition-colors"
          >
            <span className="text-sm font-medium text-[#062A63]" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Ver árbol completo
            </span>
            <ArrowRight size={16} className="text-[#062A63]" />
          </button>
        </div>
      )}
    </Section>
  )
}

// ─── Últimos Registros section ────────────────────────────────────────────────

function UltimosRegistrosSection() {
  const { data: users, isLoading, isError } = useRecentUsers(10)

  return (
    <Section title="Últimos Registros" defaultOpen={true} badge={users && users.length > 0 ? `${users.length}` : undefined}>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState message="No se pudo cargar los registros" />
      ) : !users || users.length === 0 ? (
        <EmptyState message="Aún no hay registros recientes" />
      ) : (
        <div className="overflow-x-auto">
          <table
            className="min-w-[480px] w-full text-[13px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <thead>
              <tr className="bg-gray-50">
                <th className="sticky left-0 bg-gray-50 text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3 min-w-[140px]">
                  Nombre
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3 min-w-[110px]">
                  Fecha
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3 min-w-[100px]">
                  Nivel (Rango)
                </th>
                <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3 min-w-[120px]">
                  Patrocinador
                </th>
              </tr>
            </thead>
            <tbody>
              {(users as RecentUser[]).map((u) => (
                <tr key={u.id} className="border-t border-[#EAECF0] hover:bg-gray-50 transition-colors">
                  <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-[#383A3F]">
                    {u.name}
                  </td>
                  <td className="px-3 py-3.5 text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-3 py-3.5 text-gray-500">{u.rank ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.sponsor_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

// ─── Mis Comisiones section ───────────────────────────────────────────────────

function MisComisionesSection({ userId }: { userId: string }) {
  const { data: commissions, isLoading, isError } = useCommissionHistory(userId, 20)

  const totalPagado = commissions
    ? commissions
        .filter((c) => c.status === 'pagado')
        .reduce((sum, c) => sum + c.amount, 0)
    : 0

  return (
    <Section title="Mis Comisiones">
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <EmptyState message="No se pudo cargar las comisiones" />
      ) : !commissions || commissions.length === 0 ? (
        <EmptyState message="Aún no tienes comisiones registradas" />
      ) : (
        <>
          {/* Total pagado */}
          <div className="px-5 py-3 flex items-center justify-between bg-emerald-50 border-b border-[#EAECF0]">
            <span className="text-sm text-emerald-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Total pagado
            </span>
            <span className="text-sm font-semibold text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrency(totalPagado)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table
              className="min-w-[480px] w-full text-[13px]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3 min-w-[140px]">
                    Tipo
                  </th>
                  <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3 min-w-[100px]">
                    Monto
                  </th>
                  <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3 min-w-[110px]">
                    Fecha
                  </th>
                  <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3 min-w-[110px]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {(commissions as CommissionRow[]).map((c) => (
                  <tr key={c.id} className="border-t border-[#EAECF0] hover:bg-gray-50 transition-colors">
                    <td className="sticky left-0 bg-white px-5 py-3.5 font-medium text-[#383A3F]">
                      {c.bono_type}
                    </td>
                    <td className="px-3 py-3.5 font-medium text-[#383A3F]">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-3 py-3.5 text-gray-500">
                      {formatDate(c.calculated_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Section>
  )
}

// ─── Ingresos del Mes section ─────────────────────────────────────────────────

function IngresosDelMesSection({ userId }: { userId: string }) {
  const { data: commissions, isLoading } = useCommissionHistory(userId, 100)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const thisMonth = (commissions ?? []).filter(
    (c) => c.period_month === currentMonth && c.period_year === currentYear
  )

  const comisionesGanadas = thisMonth
    .filter((c) => c.bono_type !== 'bono_red')
    .reduce((sum, c) => sum + c.amount, 0)

  const bonoRed = thisMonth
    .filter((c) => c.bono_type === 'bono_red')
    .reduce((sum, c) => sum + c.amount, 0)

  const totalMes = comisionesGanadas + bonoRed

  const stats = [
    { label: 'Comisiones Ganadas', value: comisionesGanadas },
    { label: 'Bono de Red', value: bonoRed },
    { label: 'Total del Mes', value: totalMes },
  ]

  return (
    <div>
      <h2
        className="text-sm font-semibold px-1 mb-3"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        Ingresos del mes
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[32px] h-24 animate-pulse"
              style={{ background: '#E5E7EB' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-[32px] text-center"
              style={{
                background: '#fff',
                boxShadow: '0 2px 12px rgba(6,42,99,0.07)',
              }}
            >
              <span
                className="text-base font-bold leading-tight"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {formatCurrency(value)}
              </span>
              <span
                className="text-[10px] leading-tight text-gray-400 text-center"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── NegocioPage ──────────────────────────────────────────────────────────────

export function NegocioPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const { data: dashboard } = useDashboard(userId)

  return (
    <main
      className="bg-[#F2F4F9] min-h-screen pb-28"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-xl font-semibold text-[#062A63]">Mi Negocio</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen de tu red y comisiones</p>
      </div>

      {/* Accordion sections */}
      <div className="px-5 space-y-3">
        <MiRedSection userId={userId} />
        <IngresosDelMesSection userId={userId} />
        <HoldingTankSection holdingTankCount={dashboard?.holding_tank_count} />
        <UltimosRegistrosSection />
        <MisComisionesSection userId={userId} />
      </div>
    </main>
  )
}
