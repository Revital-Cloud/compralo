import type { Discount } from '@/types/discount'
import type { Product } from '@/types'

/**
 * Verifica si un producto tiene un descuento aplicable
 */
export const getApplicableDiscount = (
  product: Product | any,
  discounts: Discount[]
): Discount | null => {
  if (!discounts || discounts.length === 0) return null

  // Buscar descuentos que aplican a este producto específico
  const applicableDiscount = discounts.find(discount => {
    // Verificar si el descuento está activo y dentro de fechas
    if (!discount.ind_activo) return false

    // Si requiere código, no mostrar en productos (solo se aplica al ingresar código en checkout)
    if (discount.requiere_codigo) return false

    const now = new Date()
    if (discount.fec_inicio) {
      const startDate = new Date(discount.fec_inicio)
      if (now < startDate) return false
    }
    if (discount.fec_fin) {
      const endDate = new Date(discount.fec_fin)
      if (now > endDate) return false
    }

    // Verificar límite de usos
    if (discount.max_usos_total && discount.usos_actuales_total) {
      if (discount.usos_actuales_total >= discount.max_usos_total) return false
    }

    // Verificar a qué aplica el descuento
    const aplicaA = discount.aplica_a || 'todos'

    // Si aplica a todos, es aplicable
    if (aplicaA === 'todos' || aplicaA === 'total_pedido') {
      return true
    }

    // Si aplica a un producto específico, debe coincidir TODA la combinación
    if (aplicaA === 'producto_especifico' && discount.id_producto_aplica) {
      // Verificar que coincidan todos los campos: categoría, línea, sublínea y producto
      // Los campos deben existir en el descuento y coincidir con el producto
      const hasAllRequiredFields = 
        discount.id_categoria != null &&
        discount.id_linea != null &&
        discount.id_sublinea != null &&
        discount.id_producto_aplica != null
      
      if (!hasAllRequiredFields) return false
      
      const productMatches = 
        product.id_producto?.toString() === discount.id_producto_aplica?.toString() &&
        product.id_categoria?.toString() === discount.id_categoria?.toString() &&
        product.id_linea?.toString() === discount.id_linea?.toString() &&
        product.id_sublinea?.toString() === discount.id_sublinea?.toString()
      
      return productMatches
    }

    // Si aplica a una categoría específica
    if (aplicaA === 'categoria_especifica' && discount.id_categoria_aplica) {
      return product.id_categoria?.toString() === discount.id_categoria_aplica.toString()
    }

    // Si aplica a una marca específica
    if (aplicaA === 'marca_especifica' && discount.id_marca_aplica) {
      return product.id_marca?.toString() === discount.id_marca_aplica.toString()
    }

    // Si aplica a una línea específica
    if (aplicaA === 'linea_especifica' && discount.id_linea_aplica) {
      return product.id_linea?.toString() === discount.id_linea_aplica.toString()
    }

    // Si aplica a una sublínea específica
    if (aplicaA === 'sublinea_especifica' && discount.id_sublinea_aplica) {
      return product.id_sublinea?.toString() === discount.id_sublinea_aplica.toString()
    }

    return false
  })

  return applicableDiscount || null
}

/**
 * Calcula el precio con descuento aplicado
 */
export const calculateDiscountedPrice = (
  originalPrice: number,
  discount: Discount
): number => {
  if (!discount) return originalPrice

  if (discount.tipo_calculo) {
    // Porcentaje
    const discountAmount = originalPrice * ((discount.val_porce_descuento || 0) / 100)
    return originalPrice - discountAmount
  } else {
    // Monto fijo
    return Math.max(0, originalPrice - (discount.val_monto_descuento || 0))
  }
}

/**
 * Formatea el valor del descuento para mostrar
 */
export const formatDiscountValue = (discount: Discount): string => {
  if (discount.tipo_calculo) {
    return `-${discount.val_porce_descuento || 0}%`
  } else {
    // Formatear monto como precio
    const amount = discount.val_monto_descuento || 0
    return `-$${amount.toLocaleString('es-CO')}`
  }
}

/**
 * Calcula el porcentaje de descuento basado en precio original y precio con descuento
 */
export const calculateDiscountPercentage = (
  originalPrice: number,
  discountedPrice: number
): number => {
  if (originalPrice <= 0 || discountedPrice >= originalPrice) return 0
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

