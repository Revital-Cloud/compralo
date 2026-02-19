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

  // Formato como en UI: "$ 100.000" (espacio después de $ y punto como separador de miles)
  const withThousands = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice)

  return `$ ${withThousands}`
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

/**
 * Formatea un número con puntos de miles (sin símbolo de moneda)
 * Ejemplo: 1600000 -> "1.600.000"
 * @param value - Número o string numérico
 * @returns String formateado con puntos de miles
 */
export function formatNumberWithDots(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  
  // Remover puntos existentes y convertir a número
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/\./g, '')) 
    : value
  
  if (isNaN(numericValue)) {
    return ''
  }
  
  // Formatear con puntos de miles (formato colombiano)
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

/**
 * Parsea un string formateado con puntos de miles a número
 * Ejemplo: "1.600.000" -> 1600000
 * @param formattedValue - String con formato "1.600.000"
 * @returns Número parseado
 */
export function parseFormattedNumber(formattedValue: string): number {
  if (!formattedValue || formattedValue.trim() === '') {
    return 0
  }
  
  // Remover puntos y espacios, luego parsear
  const cleaned = formattedValue.replace(/\./g, '').replace(/\s/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? 0 : parsed
}
