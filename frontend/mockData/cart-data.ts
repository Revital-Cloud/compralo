/**
 * Mock Data para Carrito de Compras
 * 
 * Datos de ejemplo para componentes relacionados con el carrito,
 * incluyendo productos en el carrito y productos recomendados.
 */

export interface CartItem {
  id: string
  name: string
  brand: string
  color: string
  size: string
  price: number
  originalPrice?: number
  quantity: number
  image: string
  isFavorite?: boolean
}

export interface RecommendedProduct {
  id: string
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  badge?: string
  badgeColor?: 'blue' | 'red' | 'green' | 'yellow'
}

// Productos en el carrito
export const mockCartItems: CartItem[] = [
  {
    id: '1',
    name: 'DROPSET TRAINER SHOES',
    brand: "Men's Road Running Shoes",
    color: 'Featured Blue/ University White',
    size: '10',
    price: 130.00,
    originalPrice: 150.00,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    isFavorite: false
  },
  {
    id: '2',
    name: 'ULTRABOOST 22 SHOES',
    brand: "Women's Running Shoes",
    color: 'Core Black / Solar Red',
    size: '8.5',
    price: 110.00,
    originalPrice: 140.00,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400',
    isFavorite: true
  }
]

// Productos recomendados para el carrito
export const mockRecommendedProducts: RecommendedProduct[] = [
  {
    id: 'rec-1',
    name: 'ADIDAS 4DFWD X PARLEY RUNNING SHOES',
    brand: 'ADIDAS',
    price: 130.00,
    originalPrice: 150.00,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    badge: 'NEW',
    badgeColor: 'blue'
  },
  {
    id: 'rec-2',
    name: 'NIKE AIR MAX 270 REACT',
    brand: 'NIKE',
    price: 160.00,
    originalPrice: 180.00,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
    badge: 'NEW',
    badgeColor: 'blue'
  },
  {
    id: 'rec-3',
    name: 'PUMA RS-X REINVENTION',
    brand: 'PUMA',
    price: 120.00,
    originalPrice: 140.00,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
    badge: 'HOT',
    badgeColor: 'red'
  },
  {
    id: 'rec-4',
    name: 'NEW BALANCE 1080V12',
    brand: 'NEW BALANCE',
    price: 150.00,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
    badge: 'SALE',
    badgeColor: 'green'
  },
  {
    id: 'rec-5',
    name: 'CONVERSE CHUCK TAYLOR ALL STAR',
    brand: 'CONVERSE',
    price: 85.00,
    originalPrice: 100.00,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400',
    badge: 'CLASSIC',
    badgeColor: 'yellow'
  },
  {
    id: 'rec-6',
    name: 'VANS OLD SKOOL',
    brand: 'VANS',
    price: 95.00,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400',
    badge: 'TRENDING',
    badgeColor: 'blue'
  }
]

// Configuración específica del carrito
export const cartConfig = {
  currency: 'USD',
  currencySymbol: '$',
  shipping: {
    standard: 6.99,
    express: 12.99,
    free: 0
  },
  taxRate: 0.08, // 8% de impuestos
  freeShippingThreshold: 75.00,
  maxItemsInCart: 10,
  maxQuantityPerItem: 5
} as const

// Utilidades para cálculos del carrito
export const calculateCartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = subtotal >= cartConfig.freeShippingThreshold ? cartConfig.shipping.free : cartConfig.shipping.standard
  const salesTax = subtotal * cartConfig.taxRate
  const total = subtotal + shipping + salesTax

  return {
    subtotal: Number(subtotal.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    salesTax: Number(salesTax.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount,
    freeShippingEligible: subtotal >= cartConfig.freeShippingThreshold,
    amountForFreeShipping: Math.max(0, cartConfig.freeShippingThreshold - subtotal)
  }
}

// Textos para la interfaz del carrito
export const cartTexts = {
  es: {
    title: 'Ahorrando para celebrar',
    subtitle: 'Disfruta hasta 60% de descuento en miles de estilos durante la venta de fin de año - mientras duren las existencias. No se necesita código.',
    signInText: 'Únete o Inicia sesión',
    yourBag: 'Tu Bolsa',
    bagSubtitle: 'Los artículos en tu bolsa no están reservados, finaliza la compra ahora para hacerlos tuyos.',
    emptyCartTitle: 'Tu carrito está vacío',
    emptyCartSubtitle: 'Agrega algunos productos para continuar',
    orderSummary: 'Resumen del Pedido',
    delivery: 'Envío',
    salesTax: 'Impuestos',
    total: 'Total',
    checkout: 'FINALIZAR COMPRA',
    promoCode: 'Usar código promocional',
    viewSummary: 'Ver resumen',
    youMayAlsoLike: 'También te puede gustar',
    newsletterTitle: 'ÚNETE A NUESTRO KICKSPLUS',
    newsletterSubtitle: 'CLUB Y OBTÉN 15% OFF',
    newsletterDescription: '¡Regístrate gratis! Únete a la comunidad.',
    emailPlaceholder: 'Dirección de email',
    submit: 'ENVIAR',
    size: 'Talla',
    quantity: 'Cantidad',
    viewProduct: 'VER PRODUCTO',
    item: 'ARTÍCULO',
    items: 'ARTÍCULOS'
  }
} as const

export type CartTexts = typeof cartTexts.es 