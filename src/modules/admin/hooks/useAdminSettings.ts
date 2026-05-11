import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase.ts'

export function useAdminSettings() {
  const query = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')

      if (error) throw error

      const map: Record<string, string> = {}
      for (const row of data ?? []) {
        map[row.key] = row.value
      }
      return map
    },
    staleTime: 1000 * 60 * 10,
  })

  return {
    settings: query.data ?? {},
    data: query.data ?? {},
    loading: query.isLoading,
    isLoading: query.isLoading,
  }
}

export function useUpdateAdminSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }): Promise<void> => {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
  })
}
