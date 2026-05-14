export interface Product {
  code: string
  name: string
  categoria_id: string
  is_kit: boolean
  product_status: string
  price_socio_mxn: number | null
  price_public_mxn: number | null
}

export interface UserProfile {
  id: string
  membership: string
  is_admin: boolean
}

export function getVisibleProducts(
  allProducts: Product[],
  user: UserProfile | null,
  hasPurchasedKit: boolean,
): Product[] {
  if (!user || user.is_admin) return allProducts

  return allProducts.filter((p) => {
    if (p.product_status === 'no_disponible' || p.product_status === 'agotado') return false
    if (p.categoria_id === 'membership' && user.membership === 'socio') return false
    if (p.is_kit && hasPurchasedKit) return false
    if (user.membership === 'cliente_preferente' && !p.is_kit && p.categoria_id !== 'membership')
      return false

    return true
  })
}
