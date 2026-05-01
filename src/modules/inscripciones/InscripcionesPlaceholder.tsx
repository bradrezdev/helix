import { UserPlus } from 'lucide-react'

export default function InscripcionesPlaceholder() {
  return (
    <div className="min-h-screen bg-[#F2F4F9] flex items-center justify-center">
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] p-8 text-center max-w-sm mx-4">
        <UserPlus
          size={48}
          color="#0CBCE5"
          className="mx-auto mb-4"
        />
        <h1
          className="text-xl font-bold text-[#062A63] mb-2"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Inscripciones
        </h1>
        <p className="text-sm text-[#9CA3AF] mb-4">
          Próximamente — registro de nuevos miembros en tu red
        </p>
        <span className="inline-block bg-[rgba(12,188,229,0.10)] text-[#0CBCE5] rounded-full px-3 py-1 text-xs">
          En desarrollo
        </span>
      </div>
    </div>
  )
}
