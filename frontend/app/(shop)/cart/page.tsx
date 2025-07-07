'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CartItem from '@/components/cart/cart-item'
import { ProductCard } from '@/components/product/product-card'
import { Badge } from '@/components/ui/badge'
import { X, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'

interface CartItemType {
  id: string;
  name: string;
  brand: string;
  color: string;
  size: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  isFavorite?: boolean;
}

const initialCartItems: CartItemType[] = []
const mockRecommendedProducts: any[] = []
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
    quantity: 'Cantidad:'
  }
}

const calculateCartTotals = (items: CartItemType[]) => {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 10
  const salesTax = subtotal * 0.08
  const total = subtotal + shipping + salesTax
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  return { subtotal, shipping, salesTax, total, itemCount }
}

const CartPage = () => {
  const [cartItems, setCartItems] = useState<CartItemType[]>(initialCartItems)
  const [promoCode, setPromoCode] = useState('')
  const [email, setEmail] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Funciones para manejar el carrito
  const handleQuantityChange = (id: string, quantity: number) => {
    setCartItems((items: CartItemType[]) =>
      items.map((item: CartItemType) =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveItem = (id: string) => {
    setCartItems((items: CartItemType[]) => items.filter((item: CartItemType) => item.id !== id))
  }

  const handleToggleFavorite = (id: string) => {
    setCartItems((items: CartItemType[]) =>
      items.map((item: CartItemType) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    )
  }

  // Cálculos del carrito usando la utilidad de mockData
  const cartTotals = calculateCartTotals(cartItems)
  const { subtotal, shipping, salesTax, total, itemCount } = cartTotals

  // Textos de la interfaz
  const texts = cartTexts.es

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:h-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {texts.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base max-w-4xl mb-2">
            {texts.subtitle}
          </p>
          <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
            {texts.signInText}
          </button>
        </div>

        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* Carrito Principal */}
          <div className="lg:flex-1 lg:min-w-0">
            <Card className="mb-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  {texts.yourBag}
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {texts.bagSubtitle}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {cartItems.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cartItems.map((item) => (
                      <CartItem
                        key={item.id}
                        {...item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemoveItem}
                        onToggleFavorite={handleToggleFavorite}
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
                {mockRecommendedProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="relative">
                    <ProductCard {...product} />
                  </div>
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
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                            {item.name}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {item.brand} • {texts.size} {item.size} • {texts.quantity} {item.quantity}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="font-bold text-gray-900 dark:text-white text-base">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{texts.delivery}</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {shipping > 0 ? `$${shipping.toFixed(2)}` : 'Gratis'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{texts.salesTax}</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {salesTax > 0 ? `$${salesTax.toFixed(2)}` : '-'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between font-bold text-xl">
                      <span className="text-gray-900 dark:text-white">{texts.total}</span>
                      <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-12 font-bold text-sm tracking-wide">
                      {texts.checkout}
                    </Button>
                    
                    <div className="text-center">
                      <button 
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline font-medium transition-colors"
                        onClick={() => setIsSidebarOpen(true)}
                      >
                        {texts.promoCode}
                      </button>
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
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                          {item.name}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          {item.brand} • {texts.size} {item.size} • {texts.quantity} {item.quantity}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="font-bold text-gray-900 dark:text-white text-base">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{texts.delivery}</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {shipping > 0 ? `$${shipping.toFixed(2)}` : 'Gratis'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{texts.salesTax}</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {salesTax > 0 ? `$${salesTax.toFixed(2)}` : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span className="text-gray-900 dark:text-white">{texts.total}</span>
                    <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <Button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-12 font-bold tracking-wide">
                  {texts.checkout}
                </Button>
                
                <div className="text-center">
                  <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline font-medium transition-colors">
                    {texts.promoCode}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar con Total */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-40 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
              </p>
              <p className="font-bold text-lg text-gray-900 dark:text-white">${total.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSidebarOpen(true)}
                className="px-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {texts.viewSummary}
              </Button>
              <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 px-6 font-bold tracking-wide">
                {texts.checkout}
              </Button>
            </div>
          </div>
        </div>

        {/* Overlay para mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default CartPage