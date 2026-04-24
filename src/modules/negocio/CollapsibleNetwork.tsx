import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { OrgChartTree } from '../network/OrgChartTree'
import { useUnivelTree, useSponsorTree, useNetworkStats } from '../network/useNetwork'
import type { NetworkNode, TreeType } from '../network/NetworkNode'
import { cn } from '../../lib/utils'

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
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
      <span className="text-xs text-gray-400">Cargando red...</span>
    </div>
  )
}

export function CollapsibleNetwork({ userId }: CollapsibleNetworkProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTree, setActiveTree] = useState<TreeType>('unilevel')
  const [, setSelectedNode] = useState<NetworkNode | null>(null)

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
        {/* Tab switcher */}
        <div className="flex items-center justify-end px-4 pb-3">
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
        </div>

        {/* Chart */}
        <div className="h-[420px] relative border-t border-[#EAECF0]">
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
              onNodeClick={setSelectedNode}
            />
          )}
        </div>
      </div>
    </div>
  )
}
