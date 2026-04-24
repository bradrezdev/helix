import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Cedi {
  id: string
  nombre: string
  encargado: string | null
  telefono: string | null
  calle_numero: string
  colonia: string
  municipio: string
  estado: string
  codigo_postal: string
  pais: string
  activo: boolean
}

export function useCedis() {
  const [cedis, setCedis] = useState<Cedi[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCedis() {
      const { data, error } = await supabase
        .from('cedis')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (!error) setCedis((data ?? []) as Cedi[])
      setLoading(false)
    }
    fetchCedis()
  }, [])

  return { cedis, loading }
}
