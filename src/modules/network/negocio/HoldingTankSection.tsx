import { useState, useEffect } from 'react'
import { Clock, UserCheck, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../../lib/supabase.ts'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { cn } from '../../../lib/utils.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HoldingMember {
  id: string
  member_id: string
  entered_at: string
  users: {
    name: string
    apellidos: string
    email: string
    personal_pv: number
  } | null
}

interface NetworkNode {
  id: string
  name: string
  apellidos: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Place Modal ──────────────────────────────────────────────────────────────

interface PlaceModalProps {
  member: HoldingMember
  onClose: () => void
  onSuccess: (memberId: string) => void
}

function PlaceModal({ member, onClose, onSuccess }: PlaceModalProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [nodes, setNodes] = useState<NetworkNode[]>([])
  const [filtered, setFiltered] = useState<NetworkNode[]>([])
  const [selected, setSelected] = useState<NetworkNode | null>(null)
  const [placing, setPlacing] = useState(false)
  const [loadingNodes, setLoadingNodes] = useState(true)

  useEffect(() => {
    if (!user?.id) return

    async function loadNetwork() {
      setLoadingNodes(true)
      try {
        // Get all unilevel descendants
        const { data: downline, error: downErr } = await supabase.rpc(
          'get_unilevel_downline',
          { root_id: user!.id, max_depth: 99 }
        )
        if (downErr) throw downErr

        const ids: string[] = downline?.map((d: { user_id?: string; id?: string }) => d.user_id ?? d.id).filter(Boolean) ?? []

        // Include sponsor themselves
        const allIds = [user!.id, ...ids]

        const { data: usersData, error: usersErr } = await supabase
          .from('users')
          .select('id, name, apellidos')
          .in('id', allIds)

        if (usersErr) throw usersErr

        setNodes((usersData ?? []) as NetworkNode[])
        setFiltered((usersData ?? []) as NetworkNode[])
      } catch (err) {
        console.error('Error loading network nodes:', err)
        toast.error('No se pudo cargar la red')
      } finally {
        setLoadingNodes(false)
      }
    }

    loadNetwork()
  }, [user?.id])

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

      toast.success(`${member.users?.name ?? 'Usuario'} colocado bajo ${selected.name} ${selected.apellidos}`)
      onSuccess(member.member_id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al colocar usuario'
      toast.error(msg)
    } finally {
      setPlacing(false)
    }
  }

  const memberName = member.users
    ? `${member.users.name} ${member.users.apellidos}`
    : member.member_id

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
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#062A63]">Colocar en red</h3>
            <p className="text-xs text-gray-400 mt-0.5">Selecciona dónde colocar a {memberName}</p>
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
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
            <p className="text-center text-sm text-gray-400 py-6">Sin resultados</p>
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
                    {node.name.charAt(0)}{node.apellidos.charAt(0)}
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
          {placing ? 'Colocando...' : selected ? `Colocar bajo ${selected.name}` : 'Selecciona un nodo'}
        </button>
      </div>
    </div>
  )
}

// ─── HoldingTankSection ───────────────────────────────────────────────────────

interface HoldingTankSectionProps {
  holdingTankCount?: number
}

export function HoldingTankSection({ holdingTankCount }: HoldingTankSectionProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<HoldingMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalMember, setModalMember] = useState<HoldingMember | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    async function fetchTank() {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchErr } = await supabase
          .from('holding_tank')
          .select('id, member_id, entered_at, users!member_id(name, apellidos, email, personal_pv)')
          .eq('sponsor_id', user!.id)
          .order('entered_at', { ascending: false })

        if (fetchErr) throw fetchErr
        setMembers((data ?? []) as unknown as HoldingMember[])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar holding tank'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchTank()
  }, [user?.id])

  function handlePlaceSuccess(memberId: string) {
    setMembers((prev) => prev.filter((m) => m.member_id !== memberId))
    setModalMember(null)
  }

  const count = holdingTankCount ?? members.length

  return (
    <>
      <div
        className="bg-white rounded-[32px] border border-[#EAECF0] overflow-hidden"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {/* Header row */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold text-[#062A63]">
              Holding Tank
            </span>
            {count > 0 && (
              <span className="text-xs font-semibold bg-[#0CBCE5] text-white px-2.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <div
            className={cn(
              'text-gray-400 transition-transform duration-300',
              open && 'rotate-180'
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {/* Body */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            open ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          )}
          style={open ? {} : { maxHeight: 0 }}
        >
          <div className="border-t border-[#EAECF0]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-gray-400 px-5">
                <span className="text-2xl">[WARN]</span>
                <p>No se pudo cargar el holding tank</p>
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-gray-400 px-5">
                <span className="text-2xl">[OK]</span>
                <p>No tienes usuarios en espera</p>
              </div>
            ) : (
              <div className="px-5 py-4 space-y-3">
                {members.map((member) => {
                  const name = member.users
                    ? `${member.users.name} ${member.users.apellidos}`
                    : member.member_id
                  const pv = member.users?.personal_pv ?? 0
                  const email = member.users?.email ?? ''

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4 rounded-2xl border border-[#EAECF0] bg-[#F8FAFF]"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#EAECF0] flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-[#062A63]">
                          {member.users ? `${member.users.name.charAt(0)}${member.users.apellidos.charAt(0)}` : '?'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#383A3F] truncate">{name}</p>
                        <p className="text-xs text-gray-400 truncate">{email}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[#0CBCE5] font-medium">{pv} PV</span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={11} />
                            {formatDate(member.entered_at)}
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => setModalMember(member)}
                        className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold bg-[#062A63] text-white hover:bg-[#0A3A8A] active:scale-95 transition-all"
                      >
                        Colocar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalMember && (
        <PlaceModal
          member={modalMember}
          onClose={() => setModalMember(null)}
          onSuccess={handlePlaceSuccess}
        />
      )}
    </>
  )
}
