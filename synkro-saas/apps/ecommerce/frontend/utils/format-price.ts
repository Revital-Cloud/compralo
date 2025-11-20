/**
 * Formatea un precio en formato colombiano (COP)
 * @param price - Precio en número
 * @param currency - Moneda (por defecto 'COP')
 * @returns Precio formateado como string
 */
export function formatPrice(price: number | string | null | undefined, currency: string = 'COP'): string {
  if (price === null || price === undefined) {
    return 'Precio no disponible'
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price

  if (isNaN(numericPrice)) {
    return 'Precio inválido'
  }

  // Formatear con separadores de miles y decimales
  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice)

  return formattedPrice
}

/**
 * Formatea un precio sin símbolo de moneda
 * @param price - Precio en número
 * @returns Precio formateado sin símbolo de moneda
 */
export function formatPriceWithoutCurrency(price: number | string | null | undefined): string {
  if (price === null || price === undefined) {
    return '0'
  }

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price

  if (isNaN(numericPrice)) {
    return '0'
  }

  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice)
}

/**
 * Formatea un precio con descuento
 * @param originalPrice - Precio original
 * @param discountPrice - Precio con descuento
 * @returns Objeto con precios formateados
 */
export function formatDiscountedPrice(originalPrice: number, discountPrice: number) {
  const discountPercentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
  
  return {
    original: formatPrice(originalPrice),
    discounted: formatPrice(discountPrice),
    percentage: discountPercentage,
    savings: formatPrice(originalPrice - discountPrice)
  }
}

/**
 * Formatea un rango de precios
 * @param minPrice - Precio mínimo
 * @param maxPrice - Precio máximo
 * @returns Rango de precios formateado
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatPrice(minPrice)
  }
  
  return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
}
