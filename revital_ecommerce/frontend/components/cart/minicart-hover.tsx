"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui"
import { Button } from "@/components/ui"
import { ScrollArea } from "@/components/ui"
import { Badge } from "@/components/ui"
import { useCart } from "@/hooks/use-cart"
import { useActiveDiscounts } from "@/hooks/use-discounts"
import { CART_LIMITS } from "@/services/cart.service"
import { getApplicableDiscount, calculateDiscountedPrice, calculateDiscountPercentage } from "@/utils/discount-utils"
import { formatPrice } from "@/utils/format-price"
import { getProductImageUrl } from "@/utils/image-helpers"

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
  const { items, itemCount, total, totals, isLoading, updateQuantity, isUpdatingQuantity } = useCart()
  const { data: activeDiscounts } = useActiveDiscounts()
  
  // Obtener código de descuento aplicado desde sessionStorage
  const [appliedDiscountData, setAppliedDiscountData] = React.useState<any>(null)
  
  // Función para cargar el descuento aplicado
  const loadAppliedDiscount = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    
    const codigo = sessionStorage.getItem("checkout_codigo_descuento");
    
    if (codigo) {
      try {
        const { discountService } = await import("@/services/discount.service");
        const validation = await discountService.validateDiscountForCart(codigo);
        
        if (validation && validation.es_aplicable) {
          setAppliedDiscountData({
            codigo,
            descuento: validation.descuento,
            descuento_calculado: validation.descuento_calculado,
            total_con_descuento: validation.total_con_descuento
          });
        } else {
          setAppliedDiscountData(null);
        }
      } catch (error) {
        // Si falla la validación, limpiar
        setAppliedDiscountData(null);
      }
    } else {
      setAppliedDiscountData(null);
    }
  }, []);
  
  React.useEffect(() => {
    loadAppliedDiscount();

    // Escuchar cambios en sessionStorage (otra pestaña aplica/quita código)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "checkout_codigo_descuento") {
        loadAppliedDiscount();
      }
    };

    // Misma pestaña: la página del carrito dispara este evento al aplicar/quitar código
    const handleCustomStorageChange = () => {
      loadAppliedDiscount();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("discountCodeChanged", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("discountCodeChanged", handleCustomStorageChange);
    };
  }, [loadAppliedDiscount])
  
  // Función para verificar si un descuento aplica a un producto
  const doesDiscountApplyToProduct = React.useCallback((discount: any, product: {
    id_producto?: number;
    id_categoria?: number;
    category_id?: number;
    id_marca?: number;
    marca_id?: number;
  }): boolean => {
    if (!discount || !discount.descuento) return false;
    
    const aplicaA = discount.descuento.aplica_a || 'todos';
    
    if (aplicaA === 'todos') {
      return true;
    }
    
    if (aplicaA === 'total_pedido') {
      return false;
    }
    
    if (aplicaA === 'producto_especifico' && discount.descuento.id_producto_aplica != null) {
      const productId = product.id_producto;
      return productId?.toString() === discount.descuento.id_producto_aplica?.toString();
    }
    
    if (aplicaA === 'categoria_especifica' && discount.descuento.id_categoria_aplica != null) {
      const prodCat = product.id_categoria ?? product.category_id;
      return prodCat?.toString() === discount.descuento.id_categoria_aplica?.toString();
    }
    
    if (aplicaA === 'marca_especifica' && discount.descuento.id_marca_aplica != null) {
      const prodMarca = product.id_marca;
      return prodMarca?.toString() === discount.descuento.id_marca_aplica?.toString();
    }
    
    if ((aplicaA === 'linea_especifica' || aplicaA === 'sublinea_especifica') && discount.descuento.id_categoria_aplica != null) {
      const prodCat = product.id_categoria ?? product.category_id;
      return prodCat?.toString() === discount.descuento.id_categoria_aplica?.toString();
    }
    
    return false;
  }, [])
  
  // Función para calcular precio con descuentos
  const getItemPriceWithDiscounts = React.useCallback((item: any) => {
    const originalUnitPrice = item.precio_unitario;
    let currentPrice = originalUnitPrice;
    let totalDiscountPercentage = 0;
    
    const productForDiscount = {
      id_producto: item.id_producto,
      id_categoria: item.id_categoria_producto ?? item.category_id,
      category_id: item.category_id ?? item.id_categoria_producto,
      id_marca: item.id_marca,
      marca_id: item.marca_id,
    };
    
    // 1. Calcular descuento automático
    if (activeDiscounts && activeDiscounts.length > 0) {
      const applicableDiscount = getApplicableDiscount(productForDiscount as any, activeDiscounts);
      if (applicableDiscount) {
        const discountedPrice = calculateDiscountedPrice(originalUnitPrice, applicableDiscount);
        if (discountedPrice < originalUnitPrice) {
          currentPrice = discountedPrice;
          totalDiscountPercentage = calculateDiscountPercentage(originalUnitPrice, discountedPrice);
        }
      }
    }
    
    // 2. Aplicar descuento por código si existe
    if (appliedDiscountData && appliedDiscountData.descuento) {
      const discountApplies = doesDiscountApplyToProduct(appliedDiscountData, productForDiscount);
      
      if (discountApplies) {
        const discount = appliedDiscountData.descuento;
        let priceAfterCodeDiscount = currentPrice;
        
        if (discount.tipo_calculo) {
          const discountAmount = currentPrice * ((discount.val_porce_descuento || 0) / 100);
          priceAfterCodeDiscount = currentPrice - discountAmount;
        } else {
          priceAfterCodeDiscount = Math.max(0, currentPrice - (discount.val_monto_descuento || 0));
        }
        
        if (priceAfterCodeDiscount < currentPrice) {
          currentPrice = priceAfterCodeDiscount;
          totalDiscountPercentage = originalUnitPrice > 0
            ? Math.round(((originalUnitPrice - currentPrice) / originalUnitPrice) * 100)
            : totalDiscountPercentage;
        }
      }
    }
    
    return {
      unitPrice: currentPrice,
      originalUnitPrice: originalUnitPrice,
      discountPercentage: totalDiscountPercentage > 0 ? totalDiscountPercentage : undefined,
    };
  }, [activeDiscounts, appliedDiscountData, doesDiscountApplyToProduct])

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent align="end" sideOffset={8} className="w-[500px] max-w-[90vw] p-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex flex-col" style={{ maxHeight: '85vh' }}>
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800 shrink-0">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Tu carrito</span>
            <span className="text-muted-foreground">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Cargando...</div>
        ) : Array.isArray(items) && items.length > 0 ? (
          <div className="flex flex-col">
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
                          <Image
                            src={getProductImageUrl(item.imagen_url)}
                            alt={item.nombre_producto}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">IMG</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.nombre_producto}</p>
                        {(() => {
                          const { unitPrice, originalUnitPrice, discountPercentage } = getItemPriceWithDiscounts(item);
                          const hasDiscount = discountPercentage !== undefined && discountPercentage > 0;
                          const itemTotal = unitPrice * item.cantidad;
                          
                          return (
                            <>
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                {hasDiscount ? (
                                  <>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 line-through whitespace-nowrap">
                                      ${originalUnitPrice.toLocaleString('es-CO')} c/u
                                    </p>
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                      ${unitPrice.toLocaleString('es-CO')} c/u
                                    </p>
                                    <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 shrink-0">
                                      -{discountPercentage}%
                                    </Badge>
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                    ${item.precio_unitario.toLocaleString('es-CO')} c/u
                                  </p>
                                )}
                              </div>
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
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-sm font-semibold text-right min-w-[130px] shrink-0">
                        {(() => {
                          const { unitPrice } = getItemPriceWithDiscounts(item);
                          const itemTotal = unitPrice * item.cantidad;
                          const originalTotal = item.precio_unitario * item.cantidad;
                          const hasDiscount = itemTotal < originalTotal;
                          
                          return hasDiscount ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-gray-400 dark:text-gray-500 line-through whitespace-nowrap">
                                ${originalTotal.toLocaleString('es-CO')}
                              </span>
                              <span className="text-gray-900 dark:text-white whitespace-nowrap">
                                ${itemTotal.toLocaleString('es-CO')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-900 dark:text-white whitespace-nowrap">
                              ${item.subtotal.toLocaleString('es-CO')}
                            </span>
                          );
                        })()}
                      </div>
                    </li>
                  )
                })}
              </ul>

              {Array.isArray(items) && items.length > 6 && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                  <Link href="/cart" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-lg border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    >
                      Ver demás productos
                    </Button>
                  </Link>
                </div>
              )}

              <div className="px-4 py-3 space-y-3 border-t border-gray-200 dark:border-gray-700">
              {(() => {
                const totalDescAutomaticos = Number(totals?.total_desc_automaticos ?? 0);
                const totalDescCanjeado = Number(totals?.total_desc_canjeado ?? 0);
                const hasDiscounts = totalDescAutomaticos > 0 || totalDescCanjeado > 0 || appliedDiscountData;

                // Subtotal original (suma de subtotales de ítems)
                const subtotalOriginal = Array.isArray(items) && items.length > 0
                  ? items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)
                  : 0;

                // Descuento por código aplicado (si existe)
                const descuentoCodigo = appliedDiscountData && appliedDiscountData.descuento_calculado
                  ? Number(appliedDiscountData.descuento_calculado)
                  : 0;

                // Total final = subtotal menos todos los descuentos mostrados (siempre coherente con las líneas)
                const finalTotal = Math.max(
                  0,
                  subtotalOriginal - totalDescAutomaticos - totalDescCanjeado - descuentoCodigo
                );
                
                return (
                  <>
                    {hasDiscounts && (
                      <div className="space-y-1.5 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {totalDescAutomaticos > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Descuentos automáticos</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              -{formatPrice(totalDescAutomaticos)}
                            </span>
                          </div>
                        )}
                        {appliedDiscountData && descuentoCodigo > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              Código {appliedDiscountData.codigo}
                            </span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              -{formatPrice(descuentoCodigo)}
                            </span>
                          </div>
                        )}
                        {totalDescCanjeado > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Descuento por puntos</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              -{formatPrice(totalDescCanjeado)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Total</span>
                      <span className="font-semibold text-gray-900 dark:text-white text-right min-w-[100px] whitespace-nowrap">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </>
                );
              })()}
              <div className="flex gap-2">
              <Link href="/cart" className="w-full">
                  <Button variant="outline" className="w-full cursor-pointer border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white">
                    Ver carrito
                  </Button>
                </Link>
              </div>
              </div>
          </div>
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


