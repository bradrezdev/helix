import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase.ts'
import { useAuth } from '../../../auth/hooks/useAuth.ts'

export interface Direccion {
  id: string
  user_id: string
  nombre_completo: string
  calle_numero: string
  colonia: string
  municipio: string
  estado: string
  codigo_postal: string
  pais: string
  phone: string | null
  is_default: boolean
  created_at: string | null
  updated_at: string | null
}

export interface NuevaDireccionData {
  nombre_completo: string
  calle_numero: string
  colonia: string
  municipio: string
  estado: string
  codigo_postal: string
  pais?: string
  phone?: string
}

export function useDirecciones() {
  const { user } = useAuth()
  const [direcciones, setDirecciones] = useState<Direccion[]>([])
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!user) {
      setDirecciones([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('direcciones')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error) setDirecciones((data ?? []) as Direccion[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { direcciones, loading, refetch }
}

export function useDefaultDireccion() {
  const { direcciones, loading, refetch } = useDirecciones()
  const defaultDireccion = direcciones.find((d) => d.is_default) ?? null
  return { defaultDireccion, loading, refetch, direcciones }
}

export async function saveDireccion(
  userId: string,
  data: NuevaDireccionData,
  makeDefault: boolean
): Promise<void> {
  if (makeDefault) {
    // Unset existing defaults first
    await supabase
      .from('direcciones')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true)
  }

  const { error } = await supabase.from('direcciones').insert({
    user_id: userId,
    nombre_completo: data.nombre_completo,
    calle_numero: data.calle_numero,
    colonia: data.colonia,
    municipio: data.municipio,
    estado: data.estado,
    codigo_postal: data.codigo_postal,
    pais: data.pais ?? 'México',
    is_default: makeDefault,
  })

  if (error) throw error
}

export async function setDefaultDireccion(userId: string, id: string): Promise<void> {
  // Unset all first
  await supabase
    .from('direcciones')
    .update({ is_default: false })
    .eq('user_id', userId)

  const { error } = await supabase
    .from('direcciones')
    .update({ is_default: true })
    .eq('id', id)

  if (error) throw error
}
