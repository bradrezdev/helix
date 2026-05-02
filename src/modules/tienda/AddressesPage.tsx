import { useState } from 'react'
import { MapPin, Home, Plus, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDirecciones, setDefaultDireccion } from '../../hooks/useDirecciones'
import { NuevaDireccionSheet } from '../../components/NuevaDireccionSheet'

export function AddressesPage() {
  const { user } = useAuth()
  const { direcciones, loading, refetch } = useDirecciones()
  const [showNueva, setShowNueva] = useState(false)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  async function handleSetDefault(id: string) {
    if (!user) return
    setSettingDefault(id)
    try {
      await setDefaultDireccion(user.id, id)
      await refetch()
    } finally {
      setSettingDefault(null)
    }
  }

  const defaultDir = direcciones.find((d) => d.is_default)

  return (
    <main
      className="min-h-screen"
      style={{ background: '#F2F4F9', fontFamily: 'Poppins, sans-serif', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="bg-white border-b px-5 pt-12 pb-4" style={{ borderColor: '#EAECF0' }}>
        <h1 className="text-xl font-bold" style={{ color: '#062A63' }}>
          Direcciones de envío
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          Administra tus direcciones de envío
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {loading ? (
          // Loading skeleton
          <>
            <div className="rounded-[24px] animate-pulse" style={{ height: 112, background: '#E5E7EB' }} />
            <div className="rounded-[24px] animate-pulse" style={{ height: 112, background: '#E5E7EB' }} />
          </>
        ) : direcciones.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(6,42,99,0.06)' }}
            >
              <MapPin size={28} style={{ color: '#9CA3AF' }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: '#383A3F' }}>
              Sin direcciones
            </p>
            <p className="text-xs text-center max-w-[240px]" style={{ color: '#9CA3AF' }}>
              Agrega tu primera dirección de envío para recibir tus pedidos en casa
            </p>
          </div>
        ) : (
          <>
            {/* Default address — elevated card */}
            {defaultDir && (
              <div
                className="rounded-[24px] p-5"
                style={{
                  background: '#fff',
                  border: '2px solid #062A63',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(6,42,99,0.1)' }}
                  >
                    <Home size={18} style={{ color: '#062A63' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: '#062A63' }}>
                        {defaultDir.nombre_completo}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                        style={{ background: 'rgba(6,42,99,0.1)', color: '#062A63' }}
                      >
                        <CheckCircle size={10} strokeWidth={2.5} />
                        Predeterminada
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 leading-snug" style={{ color: '#6B7280' }}>
                      {defaultDir.calle_numero}
                      {defaultDir.colonia ? `, ${defaultDir.colonia}` : ''}
                      {defaultDir.municipio ? `, ${defaultDir.municipio}` : ''}
                      , {defaultDir.estado} CP {defaultDir.codigo_postal}
                    </p>
                    {defaultDir.phone && (
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                        📞 {defaultDir.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other addresses */}
            {direcciones
              .filter((d) => !d.is_default)
              .map((dir) => (
                <div
                  key={dir.id}
                  className="rounded-[24px] p-4"
                  style={{ background: '#fff', border: '1px solid #EAECF0' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: '#F2F4F9' }}
                    >
                      <Home size={18} style={{ color: '#9CA3AF' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#383A3F' }}>
                        {dir.nombre_completo}
                      </p>
                      <p className="text-xs mt-1 leading-snug" style={{ color: '#9CA3AF' }}>
                        {dir.calle_numero}
                        {dir.colonia ? `, ${dir.colonia}` : ''}
                        {dir.municipio ? `, ${dir.municipio}` : ''}
                        , {dir.estado} CP {dir.codigo_postal}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSetDefault(dir.id)}
                      disabled={settingDefault === dir.id}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
                      style={{
                        background: 'rgba(6,42,99,0.06)',
                        color: '#062A63',
                      }}
                    >
                      {settingDefault === dir.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        'Default'
                      )}
                    </button>
                  </div>
                </div>
              ))}
          </>
        )}

        {/* Add address button */}
        <button
          onClick={() => setShowNueva(true)}
          className="w-full py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform mt-2"
          style={{ background: '#062A63' }}
        >
          <Plus size={18} color="#fff" />
          <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Agregar dirección
          </span>
        </button>
      </div>

      {/* Nueva direccion sheet */}
      <NuevaDireccionSheet
        open={showNueva}
        onClose={() => setShowNueva(false)}
        onSaved={() => refetch()}
      />
    </main>
  )
}
