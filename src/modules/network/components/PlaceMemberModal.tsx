import { useState, useEffect } from 'react'
import { Search, X, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase.ts'
import { cn } from '../../../lib/utils.ts'
import type { TankMember } from '../inscripciones/hooks/useHoldingTank.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NetworkNode {
  id: string
  name: string
  apellidos: string
}

interface PlaceMemberModalProps {
  member: TankMember
  userId: string
  onClose: () => void
  onSuccess: () => void
}

// ─── PlaceMemberModal ─────────────────────────────────────────────────────────

export function PlaceMemberModal({
  member,
  userId,
  onClose,
  onSuccess,
}: PlaceMemberModalProps) {
  const [search, setSearch] = useState('')
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [filtered, setFiltered] = useState<NetworkNode[]>([])
  const [selected, setSelected] = useState<NetworkNode | null>(null)
  const [placing, setPlacing] = useState(false)
  const [loadingNodes, setLoadingNodes] = useState(true)

  // ── Load downline network nodes ──────────────────────────────────────────

  useEffect(() => {
    if (!userId) return

    async function loadNetwork() {
      setLoadingNodes(true)
      try {
        const { data: downline, error: downErr } = await supabase.rpc(
          'get_unilevel_downline',
          { root_id: userId, max_depth: 99 }
        )
        if (downErr) throw downErr

        const nodes = (downline ?? []).map(
          (d: { user_id: string; name: string; apellidos: string }) => ({
            id: d.user_id,
            name: d.name,
            apellidos: d.apellidos,
          })
        )

        setNodes(nodes)
        setFiltered(nodes)
      } catch (err) {
        console.error('Error loading network nodes:', err)
        toast.error('No se pudo cargar la red')
      } finally {
        setLoadingNodes(false)
      }
    }

    loadNetwork()
  }, [userId])

  // ── Filter nodes by search query ────────────────────────────────────────

  useEffect(() => {
    const q = search.toLowerCase().trim()
    if (!q) {
      setFiltered(nodes)
    } else {
      setFiltered(
        nodes.filter((n) =>
          `${n.name} ${n.apellidos}`.toLowerCase().includes(q)
        )
      )
    }
  }, [search, nodes])

  // ── Place member via RPC ────────────────────────────────────────────────

  async function handlePlace() {
    if (!selected) return
    setPlacing(true)
    try {
      const { data, error } = await supabase.rpc('place_user_from_tank', {
        p_member_id: member.member_id,
        p_parent_id: selected.id,
      })

      if (error) throw error

      const result = data as { success?: boolean } | null
      if (result?.success === false) throw new Error('Placement failed')

      toast.success(
        `${member.member_name} colocado bajo ${selected.name} ${selected.apellidos}`
      )
      onSuccess()
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al colocar usuario'
      toast.error(msg)
    } finally {
      setPlacing(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] px-5 pt-5 pb-8 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Handle (mobile) */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#062A63]">
              Colocar en red
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Selecciona dónde colocar a {member.member_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-[#EAECF0] text-sm text-[#383A3F] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0CBCE5]/30 focus:border-[#0CBCE5] transition"
          />
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {loadingNodes ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">
              Sin resultados
            </p>
          ) : (
            filtered.map((node) => (
              <button
                key={node.id}
                onClick={() => setSelected(node)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors text-left',
                  selected?.id === node.id
                    ? 'border-[#0CBCE5] bg-[#F0FBFF]'
                    : 'border-[#EAECF0] hover:bg-gray-50'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#062A63]">
                    {node.name.charAt(0)}
                    {node.apellidos.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-[#383A3F]">
                  {node.name} {node.apellidos}
                </span>
                {selected?.id === node.id && (
                  <UserCheck size={16} className="ml-auto text-[#0CBCE5]" />
                )}
              </button>
            ))
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handlePlace}
          disabled={!selected || placing}
          className={cn(
            'mt-4 w-full py-3.5 rounded-full text-sm font-semibold transition-all',
            selected && !placing
              ? 'bg-[#062A63] text-white hover:bg-[#0A3A8A] active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {placing
            ? 'Colocando...'
            : selected
              ? `Colocar bajo ${selected.name}`
              : 'Selecciona un nodo'}
        </button>
      </div>
    </div>
  )
}
