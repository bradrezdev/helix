import type { OrderCommission } from '../../../hooks/useOrderDetail'
import { formatAmount, formatBonoType, formatDateTime } from '../../../lib/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditarSectionProps {
  commissions: OrderCommission[]
  loading: boolean
  country: string | null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex gap-2 py-2">
      <div className="h-4 flex-1 rounded bg-gray-100 animate-pulse" />
      <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
    </div>
  )
}

interface CommissionSubsectionProps {
  title: string
  commissions: OrderCommission[]
  showPaidAt: boolean
  loading: boolean
  country: string | null
}

function CommissionSubsection({
  title,
  commissions,
  showPaidAt,
  loading,
  country,
}: CommissionSubsectionProps) {
  return (
    <div
      className="bg-white rounded-[16px] shadow-sm p-4 flex-1"
      style={{ border: '1px solid #EAECF0' }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: 'rgba(6,42,99,0.50)', fontFamily: 'Poppins, sans-serif' }}
      >
        {title}
      </p>

      {loading ? (
        <div className="space-y-1">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : commissions.length === 0 ? (
        <p
          className="text-xs text-center py-3"
          style={{ color: 'rgba(6,42,99,0.40)', fontFamily: 'Poppins, sans-serif' }}
        >
          Sin comisiones
        </p>
      ) : (
        <div className="space-y-2">
          {commissions.map((c) => (
            <div key={c.id} className="text-xs space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-medium truncate"
                  style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                >
                  {c.recipient_name}
                </span>
                <span
                  className="shrink-0 font-semibold"
                  style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                >
                  {formatAmount(c.amount, country)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: '#E0F9FF',
                    color: '#0CBCE5',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {formatBonoType(c.bono_type)}
                </span>
                {showPaidAt && c.paid_at && (
                  <span style={{ color: 'rgba(6,42,99,0.50)', fontFamily: 'Poppins, sans-serif' }}>
                    {formatDateTime(c.paid_at)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AuditarSection ───────────────────────────────────────────────────────────

export function AuditarSection({ commissions, loading, country }: AuditarSectionProps) {
  const paid = commissions.filter((c) => c.paid_at !== null)
  const unpaid = commissions.filter((c) => c.paid_at === null)

  return (
    <div className="space-y-3">
      <p
        className="text-base font-semibold"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}
      >
        Auditar
      </p>
      {!loading && commissions.length === 0 ? (
        <div
          className="bg-white rounded-[16px] shadow-sm p-4"
          style={{ border: '1px solid #EAECF0' }}
        >
          <p
            className="text-xs text-center py-3"
            style={{ color: 'rgba(6,42,99,0.40)', fontFamily: 'Poppins, sans-serif' }}
          >
            No hay comisiones registradas para esta orden
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-3">
          <CommissionSubsection
            title="Comisiones pagadas"
            commissions={paid}
            showPaidAt
            loading={loading}
            country={country}
          />
          <CommissionSubsection
            title="Comisiones por pagar"
            commissions={unpaid}
            showPaidAt={false}
            loading={loading}
            country={country}
          />
        </div>
      )}
    </div>
  )
}
