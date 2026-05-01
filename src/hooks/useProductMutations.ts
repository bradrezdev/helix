import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ProductFormData {
  code: string
  name: string
  short_description?: string
  description?: string
  cantidad?: string
  launched_at?: string
  categoria_id?: string
  pv: number
  cv: number
  stock: number
  image_url?: string
  is_kit: boolean
  kit_type?: string
  product_status: string
  is_recommended: boolean
  protected_password?: string
  activos?: string
  price_socio_mxn?: number
  price_public_mxn?: number
  price_promotor_mxn?: number
  price_socio_usd?: number
  price_public_usd?: number
  price_promotor_usd?: number
  price_socio_cop?: number
  price_public_cop?: number
  price_promotor_cop?: number
  price_socio_eur?: number
  price_public_eur?: number
  price_promotor_eur?: number
}

export function useAddProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProductFormData): Promise<{ code: string }> => {
      const { error } = await supabase.from('products').insert(data)
      if (error) throw error
      return { code: data.code }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['store-products'] })
      queryClient.invalidateQueries({ queryKey: ['store-sections'] })
    },
  })
}

export function useEditProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string
      data: Partial<ProductFormData>
    }): Promise<void> => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('code', code)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['store-products'] })
      queryClient.invalidateQueries({ queryKey: ['store-sections'] })
    },
  })
}

interface BulkUpdateStatusParams {
  codes: string[]
  status: string
  options?: {
    userIds?: string[]
    password?: string
  }
}

export function useBulkStatusChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ codes, status, options }: BulkUpdateStatusParams): Promise<void> => {
      // Update product_status for all codes
      const updateData: Record<string, string | null> = { product_status: status }

      if (status === 'protegido' && options?.password !== undefined) {
        updateData.protected_password = options.password
      } else if (status !== 'protegido') {
        // Clear password when switching away from protegido
        updateData.protected_password = null
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .in('code', codes)

      if (updateError) throw updateError

      // If setting to privado, upsert product_private_access rows
      if (status === 'privado' && options?.userIds && options.userIds.length > 0) {
        const rows = options.userIds.flatMap((userId) =>
          codes.map((product_code) => ({
            product_code,
            user_id: userId,
          }))
        )

        const { error: accessError } = await supabase
          .from('product_private_access')
          .upsert(rows, { onConflict: 'product_code,user_id' })

        if (accessError) throw accessError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['store-products'] })
      queryClient.invalidateQueries({ queryKey: ['store-sections'] })
    },
  })
}

// Convenience wrapper matching the interface specified in the prompt
export function useProductMutations() {
  const addMutation = useAddProduct()
  const editMutation = useEditProduct()
  const bulkMutation = useBulkStatusChange()

  return {
    addProduct: (data: ProductFormData) => addMutation.mutateAsync(data),
    editProduct: (code: string, data: Partial<ProductFormData>) =>
      editMutation.mutateAsync({ code, data }),
    bulkUpdateStatus: (
      codes: string[],
      status: string,
      options?: { userIds?: string[]; password?: string }
    ) => bulkMutation.mutateAsync({ codes, status, options }),
  }
}
