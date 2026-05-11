import { useState, useRef, useEffect } from 'react'
import { FileText, ChevronDown, Loader2 } from 'lucide-react'
import { viewOrderPDF, downloadOrderPDF } from './OrderReceiptPDF.tsx'
import type { OrderReceiptPDFProps } from './OrderReceiptPDF.tsx'

// ─── Types ────────────────────────────────────────────────────────────────────

type PDFDropdownButtonProps = OrderReceiptPDFProps

// ─── PDFDropdownButton ────────────────────────────────────────────────────────

export function PDFDropdownButton(props: PDFDropdownButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  async function handleAction(mode: 'view' | 'download') {
    setOpen(false)
    setLoading(true)
    try {
      if (mode === 'view') {
        await viewOrderPDF(props)
      } else {
        await downloadOrderPDF(props)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#062A63',
          border: '1px solid #EAECF0',
          boxShadow: '0 1px 4px rgba(6,42,99,0.06)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" style={{ color: '#062A63' }} />
        ) : (
          <FileText size={14} style={{ color: '#062A63' }} />
        )}
        <span>Recibo</span>
        <ChevronDown size={12} style={{ color: '#9CA3AF' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 rounded-[12px] overflow-hidden z-50"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(6,42,99,0.12), 0 1px 4px rgba(0,0,0,0.06)',
            border: '1px solid #EAECF0',
            minWidth: '200px',
            padding: '4px',
          }}
        >
          <button
            onClick={() => handleAction('view')}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[8px] text-left transition-colors hover:bg-gray-50"
          >
            <FileText size={14} style={{ color: '#0CBCE5' }} />
            <span
              className="text-xs font-medium"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Ver nota de recibo
            </span>
          </button>
          <button
            onClick={() => handleAction('download')}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-[8px] text-left transition-colors hover:bg-gray-50"
          >
            <FileText size={14} style={{ color: '#062A63' }} />
            <span
              className="text-xs font-medium"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Descargar nota de recibo
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
