"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui"
import { Button } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { useCart } from "@/hooks/use-cart"
import { CART_LIMITS } from "@/services/cart.service"

interface MiniCartHoverProps {
  trigger: React.ReactNode
}

/**
 * MiniCartHover
 *
 * Muestra un resumen compacto del carrito cuando el usuario hace hover
 * sobre el trigger (normalmente el icono del carrito en el header).
 * Permite aumentar/disminuir cantidad directamente desde el hover.
 */
const MiniCartHover: React.FC<MiniCartHoverProps> = ({ trigger }) => {
  const { items, itemCount, total, isLoading, updateQuantity, isUpdatingQuantity } = useCart()

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent align="end" sideOffset={8} className="w-96 p-0 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tu carrito</span>
            <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
        ) : Array.isArray(items) && items.length > 0 ? (
          <>
            <ScrollArea className="max-h-72">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.slice(0, 6).map((item) => {
                  // IDs temporales de optimistic update (Date.now()) no existen en backend
                  const isTemporaryId = item.id_carrito_producto > 1e9
                  const cartTotal = total ?? 0
                  const currentItemTotal = item.precio_unitario * item.cantidad
                  const nextItemTotalInc = item.precio_unitario * (item.cantidad + 1)
                  const totalWithoutCurrent = (cartTotal || 0) - currentItemTotal
                  const plusDisabled = isTemporaryId || isUpdatingQuantity ||
                    (item.stock_disponible !== undefined && item.cantidad >= item.stock_disponible) ||
                    (totalWithoutCurrent + nextItemTotalInc > CART_LIMITS.MAX_TOTAL)
                  const minusDisabled = isTemporaryId || isUpdatingQuantity || item.cantidad <= 1

                  const handleQuantityChange = (newQty: number) => {
                    if (newQty < 1 || isTemporaryId) return
                    updateQuantity({
                      id_carrito_producto: item.id_carrito_producto,
                      cantidad: Math.floor(newQty),
                      stock_disponible: item.stock_disponible,
                    })
                  }

                  return (
                    <li key={item.id_carrito_producto} className="flex items-center gap-3 p-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {item.imagen_url ? (
                          <Image src={item.imagen_url} alt={item.nombre_producto} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.nombre_producto}</p>
                        <p className="truncate text-xs text-gray-600 dark:text-gray-300 mb-1.5">${item.precio_unitario.toLocaleString('es-CO')} c/u</p>
                        <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md w-fit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 min-w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={(e) => { e.preventDefault(); handleQuantityChange(item.cantidad - 1) }}
                            disabled={minusDisabled}
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </Button>
                          <span className="text-xs font-medium w-6 text-center tabular-nums">{item.cantidad}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 min-w-6 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={(e) => { e.preventDefault(); handleQuantityChange(item.cantidad + 1) }}
                            disabled={plusDisabled}
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-right min-w-[70px] whitespace-nowrap">
                        ${item.subtotal.toLocaleString('es-CO')}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>

            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Total</span>
                <span className="font-semibold text-gray-900 dark:text-white text-right min-w-[100px] whitespace-nowrap">${Number(total ?? 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex gap-2">
              <Link href="/cart" className="w-full">
                  <Button variant="outline" className="w-full cursor-pointer border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">Ver carrito</Button>
                </Link>
              </div>
              {Array.isArray(items) && items.length > 6 && (
                <p className="text-[11px] text-muted-foreground text-center">y {items.length - 6} más…</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm font-medium">Tu carrito está vacío</p>
            <p className="text-xs text-muted-foreground">Explora los productos y añade tus favoritos</p>
            <Link href="/products" className="inline-block">
              <Button size="sm" className="mt-2">Ir a comprar</Button>
            </Link>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export default MiniCartHover


