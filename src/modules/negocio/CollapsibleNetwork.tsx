import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { OrgChartTree } from '../network/OrgChartTree'
import { useUnivelTree, useSponsorTree, useNetworkStats } from '../network/useNetwork'
import type { NetworkNode, TreeType } from '../network/NetworkNode'
import { cn } from '../../lib/utils'

const RANK_IMAGES: Record<string, string> = {
  Bronce: '/rangos/bronce.png',
  Plata: '/rangos/plata.png',
  Oro: '/rangos/oro.png',
  Platino: '/rangos/platino.png',
  Diamante: '/rangos/diamond.png',
  'Doble Diamante': '/rangos/double-diamond.png',
  'Triple Diamante': '/rangos/triple-diamond.png',
}

function getMembershipLabel(node: NetworkNode): string {
  if (node.kitType === 'cliente_preferente') return 'Cliente Preferente'
  if (node.rank === 'Socio' || node.personalPv < 100) return 'Socio'
  return node.rank
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-50">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
)

interface CollapsibleNetworkProps {
  userId: string
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
        active
          ? 'bg-[#062A63] text-white shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      )}
    >
      {label}
    </button>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
      <span className="text-xs text-gray-400">Cargando red...</span>
    </div>
  )
}

export function CollapsibleNetwork({ userId }: CollapsibleNetworkProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTree, setActiveTree] = useState<TreeType>('unilevel')
  const [bottomSheetNode, setBottomSheetNode] = useState<NetworkNode | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const univelQuery = useUnivelTree(userId, 3)
  const sponsorQuery = useSponsorTree(userId, 3)
  const statsQuery = useNetworkStats(userId)

  const currentNodes =
    activeTree === 'unilevel' ? univelQuery.data ?? [] : sponsorQuery.data ?? []
  const isLoading =
    activeTree === 'unilevel' ? univelQuery.isLoading : sponsorQuery.isLoading

  const stats = statsQuery.data
  const totalMembers = stats?.unilevel_total ?? 0
  const activeCount = stats?.active_count ?? 0

  function handleNodeClick(node: NetworkNode) {
    if (isMobile) {
      setBottomSheetNode(node)
    }
  }

  return (
    <div className="bg-white rounded-[32px] border border-[#EAECF0] shadow-sm overflow-hidden">
      {/* Header — tappable */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-[#062A63]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Mi Red
          </span>
          {(totalMembers > 0 || activeCount > 0) && (
            <span className="text-xs font-medium bg-[#EFF6FF] text-[#062A63] px-3 py-1 rounded-full">
              {totalMembers} miembros · {activeCount} activos
            </span>
          )}
        </div>
        <ChevronDown
          size={20}
          className={cn(
            'text-gray-400 transition-transform duration-300',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expandable body */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {/* Chart — relative container with tabs inside */}
        <div className="h-[520px] relative border-t border-[#EAECF0]">
          {/* Tab switcher — inside chart, top-center */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-md px-1 py-1 flex gap-1">
              <TabButton
                label="Uninivel"
                active={activeTree === 'unilevel'}
                onClick={() => setActiveTree('unilevel')}
              />
              <TabButton
                label="Patrocinio"
                active={activeTree === 'sponsor'}
                onClick={() => setActiveTree('sponsor')}
              />
            </div>
          </div>

          {isLoading && <LoadingSpinner />}

          {!isLoading && currentNodes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="text-4xl">🌱</div>
              <p className="text-sm text-gray-400 text-center max-w-xs">
                Tu red está vacía por el momento.
              </p>
            </div>
          )}

          {!isLoading && currentNodes.length > 0 && (
            <OrgChartTree
              nodes={currentNodes}
              treeType={activeTree}
              onNodeClick={handleNodeClick}
            />
          )}

          {/* Mobile Bottom Sheet */}
          {isMobile && (
            <div
              style={{ transform: bottomSheetNode ? 'translateY(0)' : 'translateY(100%)' }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20 transition-transform duration-300 ease-out"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <button
                onClick={() => setBottomSheetNode(null)}
                className="absolute top-3 right-4 text-gray-400"
              >✕</button>

              {bottomSheetNode && (
                <div className="px-5 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
                  <div className="flex items-center gap-3 mb-4">
                    {RANK_IMAGES[bottomSheetNode.rank] ? (
                      <img
                        src={RANK_IMAGES[bottomSheetNode.rank]}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#062A63] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg font-semibold">
                          {bottomSheetNode.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 text-base">{bottomSheetNode.name}</div>
                      <div className="text-sm text-gray-500">{getMembershipLabel(bottomSheetNode)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-400">PV</div>
                      <div className="text-lg font-bold text-[#062A63]">{bottomSheetNode.personalPv}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-400">CV</div>
                      <div className="text-lg font-bold text-[#062A63]">{bottomSheetNode.personalCv}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-400">VG</div>
                      <div className="text-lg font-bold text-[#0CBCE5]">{bottomSheetNode.groupVg}</div>
                    </div>
                  </div>

                  <div className="space-y-0">
                    <InfoRow label="Rango" value={bottomSheetNode.rank} />
                    <InfoRow label="Nivel" value={`Nivel ${bottomSheetNode.levelDepth}`} />
                    <InfoRow label="Estado" value={bottomSheetNode.isActive ? 'Activo' : 'Inactivo'} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
