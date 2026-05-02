import { useState } from 'react'
import { Users, Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHoldingTank, type TankMember } from '../../hooks/useHoldingTank'
import { PlaceMemberModal } from '../../components/PlaceMemberModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TankSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-14 rounded-[18px] bg-[#F2F4F9] animate-pulse" />
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="text-center py-16" data-testid="holding-tank-empty">
      <Users size={52} className="mx-auto mb-4" style={{ color: '#9CA3AF' }} />
      <p className="text-lg font-semibold mb-1.5" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
        No tienes miembros esperando
      </p>
      <p className="text-sm max-w-sm mx-auto" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
        Los usuarios que patrocines y estén pendientes de colocación en la red aparecerán aquí
      </p>
    </div>
  )
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TankRow({ member, onPlace }: { member: TankMember; onPlace: (m: TankMember) => void }) {
  const isLongWait = member.days_waiting >= 7
  return (
    <tr className="border-b border-[#EAECF0] hover:bg-[#F2F4F9]/50 transition-colors" data-testid={`holding-tank-row-${member.member_id}`}>
      <td className="py-3.5 px-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: '#062A63' }}
          >
            {(member.member_name[0] ?? '?').toUpperCase()}
          </div>
          <div>
          <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }} data-testid="holding-tank-count">
              {member.member_name}
            </p>
            <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
              #{member.member_user_id}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3.5 px-3 text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
        {member.member_email}
      </td>
      <td className="py-3.5 px-3 text-sm whitespace-nowrap" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
        {formatDate(member.entered_at)}
      </td>
      <td className="py-3.5 px-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
          style={{
            background: isLongWait ? 'rgba(239,68,68,0.10)' : 'rgba(12,188,229,0.10)',
            color: isLongWait ? '#ef4444' : '#0CBCE5',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <Clock size={13} />
          {member.days_waiting} día{member.days_waiting !== 1 ? 's' : ''}
        </span>
      </td>
      <td className="py-3.5 px-3">
        <button
          onClick={() => onPlace(member)}
          className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold bg-[#062A63] text-white hover:bg-[#0A3A8A] active:scale-95 transition-all"
          data-testid={`holding-tank-place-${member.member_id}`}
        >
          Colocar
        </button>
      </td>
    </tr>
  )
}

// ─── Empty Row (mobile card fallback inside table) ─────────────────────────────

const TABLE_HEADERS = ['Miembro', 'Email', 'Ingresó', 'Espera', 'Acciones']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HoldingTankPage() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''
  const { data: members, isLoading, refetch } = useHoldingTank(userId)

  const isLoadingAll = authLoading || isLoading
  const [selectedMember, setSelectedMember] = useState<TankMember | null>(null)

  return (
    <div className="max-w-4xl mx-auto" data-testid="holding-tank-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
          Mi Holding Tank
        </h1>
        <p className="text-sm mt-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
          Miembros que patrocinaste y están esperando ser colocados en la red
        </p>
      </div>

      {/* Card */}
      <div
        className="bg-white rounded-[24px] p-6"
        style={{
          border: '1px solid #EAECF0',
          boxShadow: '0 4px 24px rgba(6,42,99,0.07)',
        }}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            {isLoading ? '—' : `${members?.length ?? 0} miembro${members?.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: 'rgba(12,188,229,0.10)',
              color: '#0CBCE5',
              fontFamily: 'Poppins, sans-serif',
            }}
            data-testid="holding-tank-refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Content */}
        {isLoadingAll || isLoading ? (
          <TankSkeleton />
        ) : !members || members.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[#EAECF0]">
                  {TABLE_HEADERS.map(h => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <TankRow key={m.member_id} member={m} onPlace={setSelectedMember} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Place Member Modal */}
      {selectedMember && (
        <PlaceMemberModal
          member={selectedMember}
          userId={userId}
          onClose={() => setSelectedMember(null)}
          onSuccess={() => {
            setSelectedMember(null)
            refetch()
          }}
        />
      )}

    </div>
  )
}
