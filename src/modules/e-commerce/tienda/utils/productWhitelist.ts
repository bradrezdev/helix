export interface Product {
  code: string
  name: string
  category: string
  is_kit: boolean
  status: string
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
    if (p.status === 'no_disponible' || p.status === 'agotado') return false
    if (p.category === 'membership' && user.membership === 'socio') return false
    if (p.is_kit && hasPurchasedKit) return false
    if (user.membership === 'cliente_preferente' && !p.is_kit && p.category !== 'membership')
      return false

    return true
  })
}
