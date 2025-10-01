'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CartItem from '@/components/cart/cart-item'
import { ProductCard } from '@/components/product/product-card'
import { Badge } from '@/components/ui/badge'
import { X, ShoppingBag, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Loading from '@/components/ui/loading'
import { toast } from 'sonner'
import { formatPrice } from '@/utils/format-price'
import { useQuery } from '@tanstack/react-query'
import addressService from '@/services/address.service'
import { listPaymentMethods } from '@/services/payment.service'
import { payCartAndCreateOrder } from '@/services/order.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

const cartTexts = {
  es: {
    title: 'Cesta de la compra',
    subtitle: 'Revisa y gestiona los artículos de tu cesta.',
    signInText: '¿Ya tienes una cuenta? Inicia sesión para una experiencia más rápida.',
    yourBag: 'Tu Cesta',
    bagSubtitle: 'Los artículos en tu cesta no están reservados.',
    emptyCartTitle: 'Tu cesta está vacía',
    emptyCartSubtitle: 'Parece que aún no has añadido nada.',
    youMayAlsoLike: 'También te puede gustar',
    orderSummary: 'Resumen del Pedido',
    delivery: 'Envío',
    salesTax: 'Impuestos',
    total: 'Total',
    checkout: 'Pagar',
    promoCode: '¿Tienes un código promocional?',
    size: 'Talla:',
    quantity: 'Cantidad:',
    viewSummary: 'Ver Resumen',
    loading: 'Cargando carrito...',
    errorTitle: 'Error al cargar el carrito',
    retry: 'Reintentar'
  }
}

const CartPage = () => {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Hook de autenticación
  const { user, isAuthenticated } = useAuth()

  // Hook del carrito con datos reales
  const {
    items,
    totals,
    itemCount,
    total,
    hasItems,
    isLoading,
    error,
    updateQuantity,
    removeFromCart,
    clearCart,
    refetchCart,
    id_carrito
  } = useCart()

  // Textos de la interfaz
  const texts = cartTexts.es

  // Funciones para manejar el carrito
  const handleQuantityChange = async (id: string, cantidad: number, stock_disponible?: number) => {
    const id_carrito_producto = parseInt(id)
    try {
      updateQuantity({ id_carrito_producto, cantidad, stock_disponible })
    } catch (error) {
      console.error('Error al actualizar cantidad:', error)
    }
  }

  const handleRemoveItem = async (id: string) => {
    const id_carrito_producto = parseInt(id)
    try {
      removeFromCart(id_carrito_producto)
    } catch (error) {
      console.error('Error al eliminar producto:', error)
    }
  }

  const handleToggleFavorite = (id: string) => {
    // TODO: Implementar favoritos
    console.log('Toggle favorite:', id)
    toast.info('Funcionalidad de favoritos próximamente')
  }

  // Cálculos del carrito - usar datos del backend o fallback local
  const subtotal = Number(totals?.total_productos) || (Array.isArray(items) && items.length > 0 ? items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0) : 0)
  const shipping = Number(totals?.resumen?.costo_envio) || (subtotal > 50 || subtotal === 0 ? 0 : 10)
  const salesTax = Number(totals?.resumen?.impuestos) || 0
  const finalTotal = Number(totals?.total_final) || (hasItems() ? Number(total) : 0) || 0

  // Cargar dirección principal del usuario (si existe)
  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: addressService.getMyAddresses,
    enabled: !!user?.id_usuario,
  })

  // Cargar métodos de pago y detectar predeterminado
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: listPaymentMethods,
    enabled: !!user?.id_usuario,
  })

  const defaultAddress = Array.isArray(addresses) ? addresses.find(a => a.ind_principal) || addresses[0] : undefined
  const defaultPaymentMethod = Array.isArray(paymentMethods) ? paymentMethods.find(m => m.is_default) || paymentMethods[0] : undefined

  const [isPaying, setIsPaying] = useState(false)
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null)
  const [isPMDialogOpen, setIsPMDialogOpen] = useState(false)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null)
  const [isRetryDialogOpen, setIsRetryDialogOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)

  const handleCheckout = async (pmIdOverride?: number) => {
    if (!hasItems()) {
      toast.error('Tu carrito está vacío')
      return
    }
    if (!user?.id_usuario) {
      setIsAuthDialogOpen(true)
      return
    }
    if (!defaultAddress) {
      toast.error('Agrega una dirección de envío')
      return
    }

    const effectivePM = pmIdOverride
      ?? (selectedPaymentMethodId ? Number(selectedPaymentMethodId) : Number((defaultPaymentMethod as any)?.id_metodo_pago))

    const pmObject = Array.isArray(paymentMethods)
      ? paymentMethods.find((m: any) => Number(m.id_metodo_pago) === Number(effectivePM))
      : undefined

    if (!pmObject) {
      toast.error('Selecciona un método de pago')
      return
    }
    if (!(pmObject as any).provider_source_id) {
      toast.error('Tu método de pago no está listo. Vuelve a agregar la tarjeta para generar el token de Wompi.')
      return
    }

    try {
      setIsPaying(true)
      // limpiar cualquier estado previo de pendiente
      setPendingOrderId(null)

      // 1) Pagar el carrito y crear la orden solo si es aprobado
      const payResp = await payCartAndCreateOrder(Number(id_carrito), {
        payment_method_id: Number(effectivePM),
        id_direccion: Number(defaultAddress.id_direccion),
        codigo_descuento: null,
        des_observaciones: null,
        id_canje: null,
      })

      if (payResp.status === 'APPROVED' && payResp.order_id) {
        setPendingOrderId(null)
        toast.success(`Pago aprobado. Orden #${payResp.order_id}`)
        // Vaciar carrito inmediatamente y refrescar datos
        try {
          clearCart()
          refetchCart()
        } catch (_) {}
      } else if (payResp.status === 'PENDING') {
        setPendingOrderId(null)
        toast.message('Pago pendiente de confirmación. No se ha generado la orden aún')
      } else if (payResp.status === 'DECLINED') {
        setPendingOrderId(null)
        setIsRetryDialogOpen(true)
        toast.error('Pago declinado')
      } else {
        setPendingOrderId(null)
        toast.error('Error en el pago')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || 'Error procesando el pago')
    } finally {
      setIsPaying(false)
      setIsPMDialogOpen(false)
    }
  }

  // Estado de carga después de declarar todos los hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:h-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {texts.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {texts.subtitle}
          </p>
          {/* Mensaje contextual según estado de autenticación */}
          {!isAuthenticated ? (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {texts.signInText}
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 text-sm">
                ¡Hola {user?.nom_usuario || 'Usuario'}! Tu carrito se sincroniza automáticamente.
              </p>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
          <div className="lg:col-span-2">
            {/* Tu Cesta */}
            <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <ShoppingBag className="h-6 w-6" />
                  {texts.yourBag}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {texts.bagSubtitle}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mostrar error solo si existe y es relevante para el usuario */}
                {error && typeof error === 'string' && error.includes('Stock insuficiente') && (
                  <div className="p-6">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex flex-col gap-3">
                          <span>{texts.errorTitle}: {typeof error === 'string' ? error : 'Error desconocido'}</span>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={refetchCart}
                            >
                              <Loader2 className="h-4 w-4 mr-2" />
                              {texts.retry}
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {hasItems() && Array.isArray(items) ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <CartItem
                        key={item.id_carrito_producto}
                        id={item.id_carrito_producto.toString()}
                        name={item.nombre_producto}
                        brand={item.marca || 'Sin marca'}
                        color={item.categoria || 'Sin especificar'}
                        size={item.sublinea || 'Único'}
                        price={item.precio_unitario}
                        quantity={item.cantidad}
                        image={item.imagen_url || '/placeholder-product.jpg'}
                        stock_disponible={item.stock_disponible}
                        cartTotal={finalTotal}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={false} // TODO: Implementar favoritos
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-xl">{texts.emptyCartTitle}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">{texts.emptyCartSubtitle}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* También te puede gustar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {texts.youMayAlsoLike}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gray-800 dark:bg-gray-700 border-gray-800 dark:border-gray-600 text-white"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Productos recomendados simulados */}
                {[1, 2, 3, 4].map((index) => (
                  <ProductCard
                    key={index}
                    id={`recommended-${index}`}
                    name={`Producto Recomendado ${index}`}
                    brand="Synkro"
                    price={29.99 + index * 10}
                    originalPrice={39.99 + index * 10}
                    image="/placeholder-product.jpg"
                    badge="Recomendado"
                    badgeColor="blue"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Resumen del Pedido - Desktop */}
          <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
            <div className="sticky top-8" style={{ alignSelf: 'flex-start' }}>
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
                <CardHeader className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                    {texts.orderSummary}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Lista detallada de productos */}
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                    {Array.isArray(items) && items.map((item) => (
                      <div key={item.id_carrito_producto} className="flex justify-between text-sm py-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                            {item.nombre_producto}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {item.marca || 'Sin marca'} • {texts.size} {item.sublinea || 'Único'} • {texts.quantity} {item.cantidad}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="font-bold text-gray-900 dark:text-white text-base">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{texts.delivery}</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {shipping > 0 ? formatPrice(shipping) : 'Gratis'}
                      </span>
                    </div>
                    {salesTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{texts.salesTax}</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatPrice(salesTax)}
                        </span>
                      </div>
                    )}
                    {totals?.total_descuentos && totals.total_descuentos > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Descuentos aplicados</span>
                        <span>-{formatPrice(totals.total_descuentos)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between font-bold text-xl">
                      <span className="text-gray-900 dark:text-white">{texts.total}</span>
                      <span className="text-gray-900 dark:text-white">{formatPrice(finalTotal)}</span>
                    </div>
                    {totals?.puntos_a_ganar && totals.puntos_a_ganar > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        🎉 Ganarás {totals.puntos_a_ganar} puntos con esta compra
                      </p>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold py-3 text-lg cursor-pointer"
                    disabled={!hasItems() || isPaying || !!pendingOrderId}
                    onClick={() => {
                      const count = Array.isArray(paymentMethods) ? paymentMethods.length : 0
                      if (count > 1) {
                        setSelectedPaymentMethodId(String((defaultPaymentMethod as any)?.id_metodo_pago ?? ''))
                        setIsPMDialogOpen(true)
                      } else {
                        handleCheckout()
                      }
                    }}
                  >
                    {pendingOrderId ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {`Pago pendiente · Orden #${pendingOrderId}`}
                      </span>
                    ) : isPaying ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Procesando…
                      </span>
                    ) : (
                      texts.checkout
                    )}
                  </Button>

                  {/* Código promocional */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {texts.promoCode}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Código promocional"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm">
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Resumen del Pedido - Mobile (Sidebar) */}
          <div className={`lg:hidden fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-50 ${
            isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{texts.orderSummary}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {/* Lista detallada de productos - Mobile */}
                <div className="space-y-4 mb-6">
                  {Array.isArray(items) && items.map((item) => (
                    <div key={item.id_carrito_producto} className="flex justify-between text-sm py-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                          {item.nombre_producto}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {item.marca || 'Sin marca'} • {texts.size} {item.sublinea || 'Único'} • {texts.quantity} {item.cantidad}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="font-bold text-gray-900 dark:text-white text-base">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{texts.delivery}</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {shipping > 0 ? formatPrice(shipping) : 'Gratis'}
                    </span>
                  </div>
                  {salesTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{texts.salesTax}</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatPrice(salesTax)}
                      </span>
                    </div>
                  )}
                  {totals?.total_descuentos && totals.total_descuentos > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Descuentos aplicados</span>
                      <span>-{formatPrice(totals.total_descuentos)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span className="text-gray-900 dark:text-white">{texts.total}</span>
                    <span className="text-gray-900 dark:text-white">{formatPrice(finalTotal)}</span>
                  </div>
                  {totals?.puntos_a_ganar && totals.puntos_a_ganar > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      🎉 Ganarás {totals.puntos_a_ganar} puntos con esta compra
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold py-3 text-lg"
                  disabled={!hasItems}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setIsAuthDialogOpen(true)
                      return
                    }
                    const count = Array.isArray(paymentMethods) ? paymentMethods.length : 0
                    if (count > 1) {
                      setSelectedPaymentMethodId(String((defaultPaymentMethod as any)?.id_metodo_pago ?? ''))
                      setIsPMDialogOpen(true)
                    } else {
                      handleCheckout()
                    }
                  }}
                >
                  {texts.checkout}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior móvil */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
              </p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(finalTotal)}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSidebarOpen(true)}
                className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                {texts.viewSummary}
              </Button>
              <Button 
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                disabled={!hasItems}
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsAuthDialogOpen(true)
                    return
                  }
                  const count = Array.isArray(paymentMethods) ? paymentMethods.length : 0
                  if (count > 1) {
                    setSelectedPaymentMethodId(String((defaultPaymentMethod as any)?.id_metodo_pago ?? ''))
                    setIsPMDialogOpen(true)
                  } else {
                    handleCheckout()
                  }
                }}
              >
                {texts.checkout}
              </Button>
            </div>
          </div>
        </div>

        {/* Overlay para cerrar sidebar */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Diálogo de autenticación requerida */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Debes iniciar sesión para comprar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Para finalizar tu compra necesitas iniciar sesión o registrarte.
          </p>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthDialogOpen(false)
                router.push('/register')
              }}
            >
              Registrarse
            </Button>
            <Button
              onClick={() => {
                setIsAuthDialogOpen(false)
                router.push('/login')
              }}
            >
              Iniciar sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de selección de método de pago */}
      <Dialog open={isPMDialogOpen} onOpenChange={setIsPMDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecciona un método de pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <RadioGroup value={selectedPaymentMethodId ?? ''} onValueChange={setSelectedPaymentMethodId}>
              {Array.isArray(paymentMethods) && paymentMethods.map((pm: any) => (
                <label key={pm.id_metodo_pago} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <RadioGroupItem value={String(pm.id_metodo_pago)} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {pm.brand?.toUpperCase() || 'Tarjeta'} •••• {pm.last_four_digits}
                    </div>
                    <div className="text-xs text-gray-500">Titular: {pm.card_holder} · Expira {pm.exp_month || pm.expiration_month}/{pm.exp_year || pm.expiration_year}</div>
                  </div>
                  {pm.is_default && (
                    <Badge>Principal</Badge>
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button className="w-full" disabled={!selectedPaymentMethodId || isPaying} onClick={() => handleCheckout(Number(selectedPaymentMethodId))}>
              {isPaying ? 'Procesando…' : 'Pagar con este método'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de reintento cuando el pago es declinado */}
      <AlertDialog open={isRetryDialogOpen} onOpenChange={setIsRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pago declinado</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres reintentar el pago seleccionando un método distinto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer hover:bg-transparent hover:text-inherit hover:opacity-100 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setIsRetryDialogOpen(false)}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                setIsRetryDialogOpen(false)
                const count = Array.isArray(paymentMethods) ? paymentMethods.length : 0
                if (count > 1) {
                  setSelectedPaymentMethodId(String((defaultPaymentMethod as any)?.id_metodo_pago ?? ''))
                  setIsPMDialogOpen(true)
                } else {
                  // Si solo hay una tarjeta, reintenta directo
                  handleCheckout()
                }
              }}
            >
              Sí, reintentar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CartPage