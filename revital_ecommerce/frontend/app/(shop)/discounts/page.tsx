"use client"

import { useActiveDiscounts } from "@/hooks/use-discounts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from "@/components/ui"
import { Tag, Calendar, Percent, DollarSign, ShoppingCart, Loader2 } from "lucide-react"
import { formatPrice } from "@/utils/format-price"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { Discount } from "@/types/discount"

/**
 * Mapa de la página pública de descuentos.
 *
 * Flujo:
 * - Carga descuentos activos desde `useActiveDiscounts`.
 * - Presenta condiciones principales y ejemplo de precio.
 * - Permite navegar al catálogo filtrado según alcance del descuento.
 */

export default function DiscountsPage() {
  const router = useRouter()
  const { data: discounts, isLoading, error } = useActiveDiscounts(50)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando descuentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error al cargar descuentos</p>
        </div>
      </div>
    )
  }

  const formatDiscountValue = (discount: any) => {
    if (discount.tipo_calculo) {
      // Porcentaje
      return `${discount.val_porce_descuento || 0}%`
    } else {
      // Monto fijo
      return formatPrice(discount.val_monto_descuento || 0)
    }
  }

  const getDiscountTypeLabel = (aplica_a: string) => {
    const labels: Record<string, string> = {
      'total_pedido': 'Total del pedido',
      'producto_especifico': 'Producto específico',
      'categoria_especifica': 'Categoría específica',
      'marca_especifica': 'Marca específica',
      'linea_especifica': 'Línea específica',
      'sublinea_especifica': 'Sublínea específica',
      'costo_envio': 'Costo de envío',
      'compra_minima': 'Compra mínima',
      'todos': 'Todos los productos'
    }
    return labels[aplica_a] || aplica_a
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Sin fecha límite'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleViewProducts = (discount: Discount) => {
    // Navegación contextual: producto/categoría/marca o catálogo general.
    // Si aplica a un producto específico, ir directamente al detalle de ese producto
    if (discount.aplica_a === "producto_especifico" && discount.id_producto_aplica) {
      router.push(`/products/${discount.id_producto_aplica}`)
      return
    }

    // Si aplica a una categoría / línea / sublínea específica, filtrar por categoría
    if (
      (discount.aplica_a === "categoria_especifica" ||
        discount.aplica_a === "linea_especifica" ||
        discount.aplica_a === "sublinea_especifica") &&
      discount.id_categoria_aplica
    ) {
      router.push(`/products?category_id=${discount.id_categoria_aplica}`)
      return
    }

    // Si aplica a una marca específica, filtrar por marca
    if (discount.aplica_a === "marca_especifica" && discount.id_marca_aplica) {
      router.push(`/products?brand_id=${discount.id_marca_aplica}`)
      return
    }

    // Para descuentos globales (total_pedido, todos, costo_envio, compra_minima, etc.)
    router.push("/products")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Descuentos Disponibles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aprovecha nuestras ofertas especiales y cupones de descuento
          </p>
        </div>

        {/* Descuentos Grid */}
        {!discounts || discounts.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No hay descuentos disponibles
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Vuelve pronto para ver nuestras ofertas especiales
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {discounts.map((discount) => (
              <Card 
                key={discount.id_descuento} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardHeader className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl pr-4">
                      {discount.nom_descuento}
                    </CardTitle>
                    <Badge 
                      variant="destructive" 
                      className="text-lg font-bold px-3 py-1 flex-shrink-0"
                    >
                      {formatDiscountValue(discount)}
                    </Badge>
                  </div>
                  {discount.des_descuento && (
                    <CardDescription className="text-sm">
                      {discount.des_descuento}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tipo de descuento */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{getDiscountTypeLabel(discount.aplica_a || 'todos')}</span>
                  </div>

                  {/* Fechas */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {discount.fec_inicio && formatDate(discount.fec_inicio)}
                      {discount.fec_fin && ` - ${formatDate(discount.fec_fin)}`}
                    </span>
                  </div>

                  {/* Código de descuento */}
                  {discount.codigo_descuento && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Código de cupón
                      </p>
                      <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                        {discount.codigo_descuento}
                      </p>
                    </div>
                  )}

                  {/* Ejemplo de precio resultante */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1 font-medium">
                      Ejemplo de precio
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      {discount.tipo_calculo ? (
                        <>$100.000 → {formatPrice(100000 * (1 - (discount.val_porce_descuento || 0) / 100))}</>
                      ) : (
                        <>$100.000 → {formatPrice(Math.max(0, 100000 - (discount.val_monto_descuento || 0)))}</>
                      )}
                    </p>
                  </div>

                  {/* Requisitos adicionales */}
                  {discount.min_valor_pedido && discount.min_valor_pedido > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Compra mínima: {formatPrice(discount.min_valor_pedido)}
                      </span>
                    </div>
                  )}

                  {/* Canjeable con puntos */}
                  {discount.ind_canjeable_puntos && discount.costo_puntos_canje && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                        Canjeable con {discount.costo_puntos_canje} puntos
                      </span>
                    </div>
                  )}

                  {/* Usos disponibles */}
                  {discount.max_usos_total && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {discount.usos_actuales_total || 0} de {discount.max_usos_total} usos
                    </div>
                  )}

                  {/* Botón para ver productos con este descuento aplicado */}
                  <Button
                    variant="outline"
                    className="w-full mt-2 flex items-center justify-center gap-2"
                    onClick={() => handleViewProducts(discount as Discount)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Ver productos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

