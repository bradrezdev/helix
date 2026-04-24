import { useState } from 'react'
import { OrgChartTree } from './OrgChartTree'
import { NetworkStatsBar } from './NetworkStatsBar'
import { NodeDetailPanel } from './NodeDetailPanel'
import { useUnivelTree, useSponsorTree, useNetworkStats } from './useNetwork'
import type { NetworkNode, TreeType } from './NetworkNode'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'

export default function NetworkPage() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''

  const [activeTree, setActiveTree] = useState<TreeType>('unilevel')
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [rootUserId, setRootUserId] = useState<string | null>(null)

  // Use drilled-down node id or fall back to authenticated user id
  const effectiveUserId = rootUserId ?? userId

  const univelQuery = useUnivelTree(effectiveUserId, 3)
  const sponsorQuery = useSponsorTree(effectiveUserId, 3)
  const statsQuery = useNetworkStats(effectiveUserId)

  const currentNodes =
    activeTree === 'unilevel' ? univelQuery.data ?? [] : sponsorQuery.data ?? []
  const isLoading =
    activeTree === 'unilevel' ? univelQuery.isLoading : sponsorQuery.isLoading
  const isError =
    activeTree === 'unilevel' ? univelQuery.isError : sponsorQuery.isError

  function handleViewNetwork(node: NetworkNode) {
    setRootUserId(node.id)
    setSelectedNode(null)
  }

  const stats = statsQuery.data

  // Guard: show unauthenticated state if auth is resolved and no user
  if (!authLoading && !userId) {
    return (
      <div className="flex flex-col items-center justify-center bg-[#F9FAFB]" style={{ height: '100dvh' }}>
        <div className="text-5xl mb-4">🔒</div>
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

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-full p-1 gap-1">
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
      </header>

      {/* Stats Bar */}
      <NetworkStatsBar
        univelDirects={stats?.unilevel_directs ?? 0}
        sponsorDirects={stats?.sponsor_directs ?? 0}
        totalNetwork={stats?.unilevel_total ?? 0}
        activeCount={stats?.active_count ?? 0}
        totalCount={stats?.unilevel_total ?? 0}
      />

      {/* Chart Area */}
      <div className="flex-1 relative overflow-hidden mx-4 mb-4 bg-white rounded-[32px] shadow-sm border border-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              No se pudo cargar el árbol. <br />
              Verifica tu conexión o que las RPCs estén disponibles.
            </p>
          </div>
        )}

        {!isLoading && !isError && currentNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
            <div className="text-4xl">🌱</div>
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
            onNodeClick={setSelectedNode}
          />
        )}
      </div>

      {/* Node Detail Panel */}
      <NodeDetailPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onViewNetwork={handleViewNetwork}
      />
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
          ? 'bg-white text-[#062A63] shadow-sm'
          : 'text-gray-400 hover:text-gray-600'
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
