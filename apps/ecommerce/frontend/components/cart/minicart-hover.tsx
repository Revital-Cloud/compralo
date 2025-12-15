"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@repo/ui"
import { Button } from "@repo/ui"
import { ScrollArea } from "@repo/ui"
import { useCart } from "@/hooks/use-cart"

interface MiniCartHoverProps {
  trigger: React.ReactNode
}

/**
 * MiniCartHover
 *
 * Muestra un resumen compacto del carrito cuando el usuario hace hover
 * sobre el trigger (normalmente el icono del carrito en el header).
 */
const MiniCartHover: React.FC<MiniCartHoverProps> = ({ trigger }) => {
  const { items, itemCount, total, isLoading } = useCart()

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
              <ul className="divide-y">
                {items.slice(0, 6).map((item) => (
                  <li key={item.id_carrito_producto} className="flex items-center gap-3 p-3">
                    <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {item.imagen_url ? (
                        <Image src={item.imagen_url} alt={item.nombre_producto} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.nombre_producto}</p>
                      <p className="truncate text-xs text-gray-600 dark:text-gray-300">x{item.cantidad} · ${item.precio_unitario.toLocaleString('es-CO')}</p>
                    </div>
                    <div className="text-sm font-semibold text-right min-w-[100px] whitespace-nowrap">
                      ${item.subtotal.toLocaleString('es-CO')}
                    </div>
                  </li>
                ))}
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
            <Link href="/" className="inline-block">
              <Button size="sm" className="mt-2">Ir a comprar</Button>
            </Link>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}

export default MiniCartHover


