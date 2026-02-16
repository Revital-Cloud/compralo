import type { Discount } from '@/types/discount'
import type { Product } from '@/types'

/**
 * Verifica si un producto tiene un descuento aplicable.
 * Para marca_especifica se usa id_marca del producto (debe venir en la respuesta del API).
 */
export const getApplicableDiscount = (
  product: Product | any,
  discounts: Discount[]
): Discount | null => {
  if (!discounts || discounts.length === 0) return null

  // Buscar descuentos que aplican a este producto específico
  const applicableDiscount = discounts.find(discount => {
    // Descuentos canjeables NO se muestran en productos: solo aparecen en canjes y aplican al usuario que los canjeó
    if (discount.ind_canjeable_puntos) return false

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

    // Producto específico: la BD solo tiene product_id_aplica
    if (aplicaA === 'producto_especifico' && discount.id_producto_aplica != null) {
      const productId = product.id ?? product.id_producto
      return productId?.toString() === discount.id_producto_aplica?.toString()
    }

    // Categoría específica
    if (aplicaA === 'categoria_especifica' && discount.id_categoria_aplica != null) {
      const prodCat = product.id_categoria != null ? String(product.id_categoria) : product.category_id != null ? String(product.category_id) : ''
      const discCat = String(discount.id_categoria_aplica)
      return prodCat === discCat
    }

    // Marca específica
    if (aplicaA === 'marca_especifica' && discount.id_marca_aplica != null) {
      const prodMarca = product.id_marca != null ? String(product.id_marca) : ''
      const discMarca = String(discount.id_marca_aplica)
      return prodMarca === discMarca
    }

    // Línea/sublínea: en la BD se usa category_id_aplica (categoría)
    if ((aplicaA === 'linea_especifica' || aplicaA === 'sublinea_especifica') && discount.id_categoria_aplica != null) {
      const prodCat = product.id_categoria != null ? String(product.id_categoria) : product.category_id != null ? String(product.category_id) : ''
      const discCat = String(discount.id_categoria_aplica)
      return prodCat === discCat
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

