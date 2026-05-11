import { useRecentRegistrations } from '../../admin/hooks/useRecentRegistrations.ts'
import { getRankColor } from '../genealogy/NetworkNode.ts'

interface RecentRegistrationsSectionProps {
  userId: string
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function RecentRegistrationsSection({ userId }: RecentRegistrationsSectionProps) {
  const { data: registrations, isLoading, isError } = useRecentRegistrations(userId)

  return (
    <div className="bg-white rounded-[32px] border border-[#EAECF0] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <h2
          className="text-base font-semibold text-[#062A63]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Últimos registros
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Nuevos miembros en tu organización
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-8 text-sm text-gray-400">
          No se pudo cargar los registros.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {(!registrations || registrations.length === 0) ? (
            <div className="text-center py-10 text-sm text-gray-400 px-5">
              Aún no tienes registros en tu red
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[500px] w-full text-[13px]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <thead>
                  <tr className="bg-gray-50 border-t border-[#EAECF0]">
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3 w-8">#</th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">Nombre</th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">Rango</th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">Kit</th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">Fecha registro</th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, index) => (
                    <tr
                      key={reg.id}
                      className="border-t border-[#EAECF0] hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{index + 1}</td>
                      <td className="px-3 py-3.5 font-medium text-[#383A3F]">{reg.name}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: getRankColor(reg.rank) }}
                        >
                          {reg.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-gray-500">{reg.kit_type ?? '—'}</td>
                      <td className="px-3 py-3.5 text-gray-500">{formatDate(reg.enrollment_date)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: reg.is_active ? '#10B981' : '#9CA3AF' }}
                        >
                          <span className="text-[10px]">●</span>
                          {reg.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
