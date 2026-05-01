import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useBulkStatusChange } from '../../../hooks/useProductMutations'
import { ProductStatus, PRODUCT_STATUS_LABELS } from '../../../lib/formatters'

interface EditStatusSheetProps {
  open: boolean
  onClose: () => void
  selectedCodes: string[]
}

export function EditStatusSheet({ open, onClose, selectedCodes }: EditStatusSheetProps) {
  const [status, setStatus] = useState<string>(ProductStatus.Disponible)
  const [userIds, setUserIds] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const bulkMutation = useBulkStatusChange()

  if (!open) return null

  async function handleSubmit() {
    if (selectedCodes.length === 0) return
    setSubmitError(null)

    try {
      const options: { userIds?: string[]; password?: string } = {}

      if (status === ProductStatus.Privado && userIds.trim()) {
        options.userIds = userIds
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      }

      if (status === ProductStatus.Protegido && password.trim()) {
        options.password = password.trim()
      }

      await bulkMutation.mutateAsync({ codes: selectedCodes, status, options })
      toast.success(`Estado actualizado a ${PRODUCT_STATUS_LABELS[status] ?? status}`)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar'
      setSubmitError(msg)
      toast.error(msg)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000]"
        style={{ background: 'rgba(6,42,99,0.22)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[2001] flex flex-col"
        style={{
          background: '#fff',
          borderRadius: '32px 32px 0 0',
          maxHeight: '80dvh',
          boxShadow: '0 -8px 40px rgba(6,42,99,0.14)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <div>
            <h2
              className="text-[17px] font-semibold"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Cambiar estado
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              {selectedCodes.length} producto{selectedCodes.length !== 1 ? 's' : ''} seleccionado{selectedCodes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F2F4F9' }}
          >
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
          {/* Status picker */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              Nuevo estado
            </p>
            <div className="flex flex-col gap-2">
              {Object.values(ProductStatus).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className="flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                  style={{
                    background: status === s ? 'rgba(6,42,99,0.04)' : '#F8FAFF',
                    border: status === s ? '1.5px solid #062A63' : '1.5px solid transparent',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: status === s ? '#062A63' : '#D1D5DB' }}
                  >
                    {status === s && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#062A63' }} />
                    )}
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {PRODUCT_STATUS_LABELS[s]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Privado: user IDs input */}
          {status === ProductStatus.Privado && (
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
              >
                IDs de usuarios con acceso (uno por línea o separados por comas)
              </p>
              <textarea
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                rows={4}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
                style={{
                  background: '#F2F4F9',
                  color: '#383A3F',
                  fontFamily: 'Poppins, sans-serif',
                  border: '1.5px solid transparent',
                }}
                placeholder="uuid-1&#10;uuid-2&#10;uuid-3"
              />
            </div>
          )}

          {/* Protegido: password input */}
          {status === ProductStatus.Protegido && (
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
              >
                Contraseña de acceso
              </p>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{
                  background: '#F2F4F9',
                  color: '#383A3F',
                  fontFamily: 'Poppins, sans-serif',
                  border: '1.5px solid transparent',
                }}
                placeholder="Contraseña"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-5 py-4"
          style={{ borderTop: '1px solid #F2F4F9' }}
        >
          {submitError && (
            <p
              className="text-xs mb-3 text-center"
              style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
            >
              {submitError}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={bulkMutation.isPending || selectedCodes.length === 0}
            className="w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
          >
            {bulkMutation.isPending && <Loader2 size={16} color="#fff" className="animate-spin" />}
            Aplicar cambio
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
