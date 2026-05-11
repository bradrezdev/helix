import { useState, useEffect } from 'react'
import { X, Building2, ChevronDown, ChevronUp, Check, Phone, User } from 'lucide-react'
import { useCedis, type Cedi } from '../hooks/useCedis.ts'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (cedi: Cedi) => void
}

export function CediSelectorSheet({ open, onClose, onSelect }: Props) {
  const { cedis, loading } = useCedis()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function handleConfirm() {
    const cedi = cedis.find((c) => c.id === selectedId)
    if (cedi) {
      onSelect(cedi)
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000]"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[1001] flex flex-col"
        style={{
          background: '#ffffff',
          borderRadius: '32px 32px 0 0',
          maxHeight: '80dvh',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Building2 size={18} color="#062A63" strokeWidth={2} />
            <h2
              className="text-[17px] font-semibold"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Seleccionar CEDI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-center py-8" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
              Cargando centros...
            </p>
          ) : cedis.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
              No hay centros disponibles
            </p>
          ) : (
            cedis.map((cedi) => {
              const isSelected = selectedId === cedi.id
              const isExpanded = expandedId === cedi.id

              return (
                <div
                  key={cedi.id}
                  className="rounded-[24px] border-2 overflow-hidden transition-all"
                  style={{
                    borderColor: isSelected ? '#062A63' : '#EAECF0',
                    background: isSelected ? 'rgba(6,42,99,0.03)' : '#fff',
                  }}
                >
                  {/* Card header — tap to select + expand */}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5"
                    onClick={() => {
                      setSelectedId(cedi.id)
                      setExpandedId(isExpanded ? null : cedi.id)
                    }}
                  >
                    {/* Radio indicator */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: isSelected ? '#062A63' : '#D1D5DB' }}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#062A63' }} />}
                    </div>

                    <div className="flex-1 text-left">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {cedi.nombre}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {cedi.estado} · {cedi.municipio}
                      </p>
                    </div>

                    {isExpanded
                      ? <ChevronUp size={16} color="#9CA3AF" />
                      : <ChevronDown size={16} color="#9CA3AF" />}
                  </button>

                  {/* Expandable details */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 flex flex-col gap-2"
                      style={{ borderTop: '1px solid #EAECF0' }}
                    >
                      <div className="pt-3 flex flex-col gap-2">
                        <DetailRow
                          icon={<Building2 size={13} color="#6B7280" />}
                          text={`${cedi.calle_numero}, ${cedi.colonia}, ${cedi.municipio}, ${cedi.estado}, CP ${cedi.codigo_postal}`}
                        />
                        {cedi.telefono && (
                          <DetailRow
                            icon={<Phone size={13} color="#6B7280" />}
                            text={cedi.telefono}
                          />
                        )}
                        {cedi.encargado && (
                          <DetailRow
                            icon={<User size={13} color="#6B7280" />}
                            text={`Encargado: ${cedi.encargado}`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* CTA footer */}
        <div
          className="shrink-0 px-5 py-4"
          style={{ borderTop: '1px solid #EAECF0' }}
        >
          <button
            onClick={handleConfirm}
            disabled={!selectedId}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40"
            style={{ background: '#062A63' }}
          >
            <Check size={17} color="#fff" strokeWidth={2.5} />
            <span
              className="text-white font-semibold text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Confirmar CEDI
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

function DetailRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span
        className="text-xs"
        style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
      >
        {text}
      </span>
    </div>
  )
}
