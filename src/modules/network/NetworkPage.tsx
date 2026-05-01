import { useState, useEffect } from 'react'
import { OrgChartTree } from './OrgChartTree'
import { NetworkStatsBar } from './NetworkStatsBar'
import { NodeDetailPanel } from './NodeDetailPanel'
import { useUnivelTree, useSponsorTree, useNetworkStats } from './useNetwork'
import type { NetworkNode, TreeType } from './NetworkNode'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabase'

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

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''
  const { data: profile } = useProfile(userId)
  const isAdmin = profile?.is_admin === true

  const [activeTree, setActiveTree] = useState<TreeType>('unilevel')
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [rootUserId, setRootUserId] = useState<string | null>(null)
  const [bottomSheetNode, setBottomSheetNode] = useState<NetworkNode | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Admin search state
  const [adminSearchQuery, setAdminSearchQuery] = useState('')
  const [adminSearchResults, setAdminSearchResults] = useState<any[]>([])
  const [adminSearching, setAdminSearching] = useState(false)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const effectiveUserId = rootUserId ?? userId

  // Admin search handler
  async function handleAdminSearch(query: string) {
    setAdminSearchQuery(query)
    if (query.length < 2) { setAdminSearchResults([]); return }
    setAdminSearching(true)
    try {
      const isNumeric = /^\d+$/.test(query)
      let q = supabase.from('users').select('id, user_id, name, email').limit(5)
      if (isNumeric) q = q.eq('user_id', Number(query))
      else q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      const { data } = await q
      setAdminSearchResults((data ?? []) as any[])
    } finally {
      setAdminSearching(false)
    }
  }

  function handleSelectAdminUser(u: any) {
    setRootUserId(u.id) // Set searched user as org chart root
    setAdminSearchResults([])
    setAdminSearchQuery(`${u.name} (#${u.user_id})`)
  }

  function clearAdminSearch() {
    setRootUserId(null) // Reset to own network
    setAdminSearchQuery('')
  }

  const univelQuery = useUnivelTree(effectiveUserId, 3)
  const sponsorQuery = useSponsorTree(effectiveUserId, 3)
  const statsQuery = useNetworkStats(effectiveUserId)

  const currentNodes =
    activeTree === 'unilevel' ? univelQuery.data ?? [] : sponsorQuery.data ?? []
  const isLoading =
    activeTree === 'unilevel' ? univelQuery.isLoading : sponsorQuery.isLoading
  const isError =
    activeTree === 'unilevel' ? univelQuery.isError : sponsorQuery.isError

  function handleNodeClick(node: NetworkNode) {
    if (isMobile) {
      setBottomSheetNode(node)
    } else {
      setSelectedNode(node)
    }
  }

  function handleViewNetwork(node: NetworkNode) {
    setRootUserId(node.id)
    setSelectedNode(null)
    setBottomSheetNode(null)
  }

  const stats = statsQuery.data

  if (!authLoading && !userId) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#F9FAFB]" style={{ height: '100dvh' }}>
        <div className="text-5xl mb-4">[LOCK]</div>
        <h2 className="text-lg font-semibold text-[#062A63]">Sesión no activa</h2>
        <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
          Inicia sesión para ver tu red de distribuidores.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-[#F9FAFB]" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-[#062A63] tracking-tight">Mi Red</h1>
          <p className="text-xs text-gray-400 mt-0.5">Visualización de tu estructura MLM</p>
        </div>
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setAdminSearchQuery(adminSearchQuery ? '' : 'admin')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#062A63] text-white"
            >
              [SEARCH]Admin
            </button>
          </div>
        )}
      </header>
      
      {/* Admin Search Bar - only shown to admins */}
      {isAdmin && (
        <div className="px-5 pb-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar usuario por nombre, email o ID..."
              value={adminSearchQuery}
              onChange={(e) => handleAdminSearch(e.target.value)}
              className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm bg-white"
            />
            {adminSearchQuery && (
              <button
                onClick={clearAdminSearch}
                className="absolute right-3 top-3 text-xs text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            )}
            {adminSearchResults.length > 0 && !rootUserId && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#EAECF0] rounded-[18px] shadow-lg max-h-40 overflow-y-auto">
                {adminSearchResults.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectAdminUser(u)}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#F2F4F9] flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#062A63] flex items-center justify-center text-xs font-bold text-white">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-500">#{u.user_id} — {u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {adminSearching && (
              <p className="text-xs text-gray-400 mt-1">Buscando...</p>
            )}
          </div>
          {rootUserId && adminSearchQuery && (
            <p className="text-xs text-blue-600 mt-1">Mostrando red de: <strong>{adminSearchQuery}</strong></p>
          )}
        </div>
      )}

      {/* Stats Bar */}
      <NetworkStatsBar
        univelDirects={stats?.unilevel_directs ?? 0}
        sponsorDirects={stats?.sponsor_directs ?? 0}
        totalNetwork={stats?.unilevel_total ?? 0}
        activeCount={stats?.active_count ?? 0}
        totalCount={stats?.unilevel_total ?? 0}
      />

      {/* Chart Area */}
      <div className="flex-1 relative overflow-hidden mx-4 mb-4 bg-white rounded-[32px] shadow-sm border border-gray-100" style={{ minHeight: '400px' }}>
        {/* Tab Switcher — inside chart, top-center */}
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

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <div className="text-4xl">[WARN]</div>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              No se pudo cargar el árbol. <br />
              Verifica tu conexión o que las RPCs estén disponibles.
            </p>
          </div>
        )}

        {!isLoading && !isError && currentNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <div className="text-4xl">[SEED]</div>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Tu red está vacía por el momento.<br />
              Comienza a patrocinar distribuidores.
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
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            {/* Close button */}
            <button
              onClick={() => setBottomSheetNode(null)}
              className="absolute top-3 right-4 text-gray-400"
            >X</button>

            {bottomSheetNode && (
              <div className="px-5 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {/* Avatar + name header */}
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

                {/* Stats grid */}
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

                {/* Info list */}
                <div className="space-y-0">
                  <InfoRow label="Rango" value={bottomSheetNode.rank} />
                  <InfoRow label="Nivel" value={`Nivel ${bottomSheetNode.levelDepth}`} />
                  <InfoRow label="Estado" value={bottomSheetNode.isActive ? 'Activo' : 'Inactivo'} />
                </div>

                {/* View network button */}
                <button
                  onClick={() => handleViewNetwork(bottomSheetNode)}
                  className="w-full py-3 rounded-full text-sm font-semibold text-white mt-2"
                  style={{ background: '#062A63' }}
                >
                  Ver su red
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Node Detail Panel (desktop only) */}
      {!isMobile && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onViewNetwork={handleViewNetwork}
        />
      )}
    </div>
  )
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
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-10 h-10 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin"
      />
      <span className="text-xs text-gray-400">Cargando red...</span>
    </div>
  )
}
