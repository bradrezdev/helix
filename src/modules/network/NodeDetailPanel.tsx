import { getRankColor } from './NetworkNode'
import type { NetworkNode } from './NetworkNode'
import { cn } from '../../lib/utils'

interface NodeDetailPanelProps {
  node: NetworkNode | null
  onClose: () => void
  onViewNetwork?: (node: NetworkNode) => void
}

export function NodeDetailPanel({ node, onClose, onViewNetwork }: NodeDetailPanelProps) {
  const isOpen = !!node

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/10 z-20 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-30 flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ borderRadius: '24px 0 0 24px' }}
      >
        {node && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
                Perfil del Nodo
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center gap-3 pb-5 border-b border-gray-100">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold"
                  style={{ background: '#062A63' }}
                >
                  {node.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-[#383A3F]">{node.name}</div>
                  <div
                    className="inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{
                      background: getRankColor(node.rank) + '18',
                      color: getRankColor(node.rank),
                    }}
                  >
                    {node.rank}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-col gap-3">
                <DetailRow label="CV Personal" value={node.personalCv.toLocaleString('es-MX')} />
                <DetailRow label="Kit" value={node.kitType ?? '—'} />
                <DetailRow label="Nivel" value={`Profundidad ${node.levelDepth}`} />
                <DetailRow
                  label="Estado"
                  value={node.isActive ? 'Activo' : 'Inactivo'}
                  valueColor={node.isActive ? '#10B981' : '#9CA3AF'}
                />
              </div>
            </div>

            {/* Footer */}
            {onViewNetwork && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => onViewNetwork(node)}
                  className="w-full py-3 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#062A63' }}
                >
                  Ver su red
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-[#383A3F]" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
    </div>
  )
}
