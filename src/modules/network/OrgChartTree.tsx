import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { OrgChart } from 'd3-org-chart'
import type { NetworkNode } from './NetworkNode'
import { getInitial } from './NetworkNode'

interface OrgChartNode {
  id: string
  parentId: string | null
  name: string
  rank: string
  isActive: boolean
  personalCv: number
  personalPv: number
  groupVg: number
  kitType: string | null
}

const RANK_IMAGES: Record<string, string> = {
  Bronce: '/rangos/bronce.png',
  Plata: '/rangos/plata.png',
  Oro: '/rangos/oro.png',
  Platino: '/rangos/platino.png',
  Diamante: '/rangos/diamond.png',
  'Doble Diamante': '/rangos/double-diamond.png',
  'Triple Diamante': '/rangos/triple-diamond.png',
}

function getMembershipLabel(node: OrgChartNode): string {
  if (node.kitType === 'cliente_preferente') return 'Cliente Preferente'
  if (node.rank === 'Socio' || node.personalPv < 100) return 'Socio'
  return node.rank
}

function buildNodeTemplate(node: OrgChartNode): string {
  const initial = getInitial(node.name)
  const rankImage = RANK_IMAGES[node.rank] ?? null
  const membershipLabel = getMembershipLabel(node)
  const opacity = node.isActive ? '1' : '0.55'
  const borderColor = node.isActive ? '#e5e7eb' : '#f3f4f6'

  const avatarHtml = rankImage
    ? `<img src="${rankImage}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #e5e7eb;" />`
    : `<div style="width:34px;height:34px;border-radius:50%;background:#062A63;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="color:white;font-size:13px;font-weight:600;line-height:1;">${initial}</span>
      </div>`

  const activeBadge = node.isActive
    ? `<div style="background:#d1fae5;color:#065f46;font-size:8px;font-weight:700;padding:2px 5px;border-radius:9999px;flex-shrink:0;letter-spacing:0.3px;">Activo</div>`
    : `<div style="background:#fee2e2;color:#991b1b;font-size:8px;font-weight:700;padding:2px 5px;border-radius:9999px;flex-shrink:0;letter-spacing:0.3px;">Inactivo</div>`

  return `
<div style="width:100%;height:100%;box-sizing:border-box;padding:8px 10px;background:white;border-radius:16px;border:1.5px solid ${borderColor};box-shadow:0 2px 8px rgba(0,0,0,0.08);font-family:Poppins,sans-serif;opacity:${opacity};cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;">
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;">
    ${avatarHtml}
    <div style="flex:1;min-width:0;">
      <div style="font-size:11px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">${node.name}</div>
      <div style="font-size:9px;color:#6b7280;margin-top:1px;">${membershipLabel}</div>
    </div>
    ${activeBadge}
  </div>
  <div style="display:flex;gap:3px;">
    <div style="flex:1;background:#f9fafb;border-radius:8px;padding:3px 4px;text-align:center;">
      <div style="font-size:8px;color:#9ca3af;font-weight:500;">PV</div>
      <div style="font-size:10px;font-weight:700;color:#062A63;line-height:1.4;">${node.personalPv}</div>
    </div>
    <div style="flex:1;background:#f9fafb;border-radius:8px;padding:3px 4px;text-align:center;">
      <div style="font-size:8px;color:#9ca3af;font-weight:500;">CV</div>
      <div style="font-size:10px;font-weight:700;color:#062A63;line-height:1.4;">${node.personalCv}</div>
    </div>
    <div style="flex:1;background:#f0fbff;border-radius:8px;padding:3px 4px;text-align:center;">
      <div style="font-size:8px;color:#0CBCE5;font-weight:500;">VG</div>
      <div style="font-size:10px;font-weight:700;color:#0CBCE5;line-height:1.4;">${node.groupVg}</div>
    </div>
  </div>
</div>`
}

interface OrgChartTreeProps {
  nodes: NetworkNode[]
  treeType: 'unilevel' | 'sponsor'
  onNodeClick?: (node: NetworkNode) => void
}

export function OrgChartTree({ nodes, treeType, onNodeClick }: OrgChartTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<OrgChart<OrgChartNode> | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    // Destroy previous chart instance fully before re-creating
    if (chartRef.current) {
      try {
        containerRef.current.innerHTML = ''
      } catch (_) { /* ignore */ }
      chartRef.current = null
    }

    const chartData: OrgChartNode[] = nodes.map((n) => ({
      id: n.id,
      parentId: n.parentId ?? null,
      name: n.name,
      rank: n.rank,
      isActive: n.isActive,
      personalCv: n.personalCv,
      personalPv: n.personalPv,
      groupVg: n.groupVg,
      kitType: n.kitType,
    }))

    const chart = new OrgChart<OrgChartNode>()
    chartRef.current = chart

    chart
      .container(containerRef.current)
      .data(chartData)
      .nodeWidth(() => 220)
      .nodeHeight(() => 130)
      .childrenMargin(() => 50)
      .compactMarginBetween(() => 15)
      .compactMarginPair(() => 80)
      .neighbourMargin(() => 20)
      .siblingsMargin(() => 20)
      .buttonContent(({ node }) => {
        const count = (node.data as OrgChartNode & { _directSubordinates?: number })._directSubordinates ?? 0
        return `<div style="border-radius:20px;background:#062A63;color:white;font-size:10px;font-family:Poppins,sans-serif;font-weight:600;padding:3px 10px;cursor:pointer;">${count} ▾</div>`
      })
      .nodeContent((node) => buildNodeTemplate(node.data))
      .onNodeClick((nodeData) => {
        if (onNodeClick) {
          const original = nodes.find((n) => n.id === nodeData.data.id)
          if (original) onNodeClick(original)
        }
      })
      .initialZoom(0.75)
      .render()

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      chartRef.current = null
    }
  }, [nodes, treeType])

  const zoomIn = () => chartRef.current?.zoomIn()
  const zoomOut = () => chartRef.current?.zoomOut()
  const resetZoom = () => chartRef.current?.fit()
  const expandAll = () => chartRef.current?.expandAll()

  return (
    <div
      style={isFullscreen
        ? { position: 'fixed', inset: 0, zIndex: 9999, width: '100vw', height: '100dvh', background: 'white', overflow: 'hidden' }
        : { position: 'relative', width: '100%', height: '100%' }
      }
    >
      {/* Controls — bottom-right */}
      <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="w-9 h-9 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-[#062A63] text-lg font-light hover:shadow-lg transition-shadow"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-[#062A63] text-lg font-light hover:shadow-lg transition-shadow"
        >
          −
        </button>
        <button
          onClick={resetZoom}
          className="w-9 h-9 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-[#062A63] hover:shadow-lg transition-shadow"
          title="Reset view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
        <button
          onClick={expandAll}
          className="w-9 h-9 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-[#062A63] hover:shadow-lg transition-shadow"
          title="Expandir todo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7"/>
            <polyline points="11 17 6 12 11 7"/>
          </svg>
        </button>
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          className="w-9 h-9 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-[#062A63] hover:shadow-lg transition-shadow"
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <X size={16} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 3 21 3 21 9"/>
              <polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          )}
        </button>
      </div>

      {/* Chart container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', boxSizing: 'border-box' }} />
    </div>
  )
}
