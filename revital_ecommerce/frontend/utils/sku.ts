/**
 * Genera una sugerencia de SKU para una variante (frontend).
 * El backend puede regenerar con fun_generate_sku si se envía vacío.
 */
export interface VariantDataForSku {
  productId?: number
  productName?: string
  brandName?: string
  color?: string
  size?: string
  index?: number
}

const safePart = (s: string | undefined, maxLen = 8): string => {
  if (!s?.trim()) return ''
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, maxLen)
}

export function generateSKU(data: VariantDataForSku): string {
  const parts: string[] = []
  if (data.brandName) parts.push(safePart(data.brandName, 6))
  if (data.productName) parts.push(safePart(data.productName, 8))
  if (data.productId) parts.push(String(data.productId))
  if (data.color) parts.push(safePart(data.color, 4))
  if (data.size) parts.push(safePart(data.size, 4))
  if (data.index != null) parts.push(String(data.index + 1))
  if (parts.length === 0) return ''
  return parts.join('-')
}
