import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { OrgChart } from 'd3-org-chart'
import type { NetworkNode } from './NetworkNode'
import { getRankColor, getInitial } from './NetworkNode'

interface OrgChartNode {
  id: string
  parentId: string | null
  name: string
  rank: string
  isActive: boolean
  personalCv: number
}

interface OrgChartTreeProps {
  nodes: NetworkNode[]
  treeType: 'unilevel' | 'sponsor'
  onNodeClick?: (node: NetworkNode) => void
}

function buildNodeTemplate(node: OrgChartNode): string {
  const initial = getInitial(node.name)
  const rankColor = getRankColor(node.rank)
  const activeColor = node.isActive ? '#10B981' : '#9CA3AF'
  const activeText = node.isActive ? 'Activo' : 'Inactivo'
  const opacity = node.isActive ? '1' : '0.55'
  const cv = node.personalCv.toLocaleString('es-MX')

  return `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 12px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1.5px solid #EAECF0;
      font-family: Poppins, sans-serif;
      width: 180px;
      opacity: ${opacity};
      transition: box-shadow 0.15s ease;
      cursor: pointer;
    ">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="
          width:36px; height:36px; border-radius:50%;
          background: #062A63; color:white;
          display:flex; align-items:center; justify-content:center;
          font-weight:600; font-size:14px; flex-shrink:0;
        ">${initial}</div>
        <div style="overflow:hidden;">
          <div style="font-weight:600; font-size:13px; color:#383A3F; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${node.name}</div>
          <div style="font-size:11px; color:${rankColor}; font-weight:500">${node.rank}</div>
        </div>
      </div>
      <div style="margin-top:8px; display:flex; justify-content:space-between; font-size:11px; color:#6B7280;">
        <span>CV: ${cv}</span>
        <span style="color:${activeColor};">● ${activeText}</span>
      </div>
    </div>
  `
}

export function OrgChartTree({ nodes, treeType, onNodeClick }: OrgChartTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<OrgChart<OrgChartNode> | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    const chartData: OrgChartNode[] = nodes.map((n) => ({
      id: n.id,
      parentId: n.parentId,
      name: n.name,
      rank: n.rank,
      isActive: n.isActive,
      personalCv: n.personalCv,
    }))

    if (!chartRef.current) {
      chartRef.current = new OrgChart<OrgChartNode>()
    }

    const chart = chartRef.current

    chart
      .container(containerRef.current)
      .data(chartData)
      .nodeWidth(() => 196)
      .nodeHeight(() => 86)
      .childrenMargin(() => 40)
      .compactMarginBetween(() => 15)
      .compactMarginPair(() => 80)
      .neighbourMargin(() => 20)
      .siblingsMargin(() => 20)
      .buttonContent(({ node }) => {
        const count = node.data._directSubordinates
        return `<div style="
          border-radius: 20px;
          background: #062A63;
          color: white;
          font-size: 10px;
          font-family: Poppins, sans-serif;
          font-weight: 600;
          padding: 3px 10px;
          cursor: pointer;
          border: none;
        ">${count > 0 ? `▾ ${count}` : '▸ 0'}</div>`
      })
      .nodeContent((node) => buildNodeTemplate(node.data))
      .onNodeClick((nodeData) => {
        if (onNodeClick) {
          const original = nodes.find((n) => n.id === nodeData.data.id)
          if (original) onNodeClick(original)
        }
      })
      .initialZoom(0.8)
      .render()

    return () => {
      // cleanup handled by re-render
    }
  }, [nodes, treeType])

  const zoomIn = () => chartRef.current?.zoomIn()
  const zoomOut = () => chartRef.current?.zoomOut()
  const resetZoom = () => chartRef.current?.fit()
  const expandAll = () => chartRef.current?.expandAll()

  return (
    <div className={isFullscreen
      ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] bg-white flex flex-col overflow-hidden'
      : 'relative flex-1 flex flex-col overflow-hidden'
    }>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
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
      <div ref={containerRef} className="flex-1 w-full overflow-hidden" style={{ minHeight: 0 }} />
    </div>
  )
}
