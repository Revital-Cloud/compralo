import { useQuery } from '@tanstack/react-query'
import { get } from '@/utils/apiWrapper'
import { favoritesService } from '@/services/favorites.service'
import { pointsService } from '@/services/points.service'
import type { Order } from '@/types/order'
import type { PointsPerUser } from '@/types/points'

/**
 * Hook: `useAccountStats`.
 *
 * Propósito:
 * - Obtener y componer estadísticas “resumen” para la pestaña de perfil del usuario.
 * - Centraliza la lógica de agregación (cálculos) para que la UI no haga conversiones
 *   ni recorra colecciones sin control.
 *
 * Flujo interno:
 * 1) Si `userId` es falsy, retorna un objeto “cero” (evita llamadas a backend).
 * 2) Obtiene `orders` desde `GET /orders`.
 * 3) Calcula:
 *    - `completedOrders`: órdenes donde `ind_estado === 2`
 *    - `totalSpent`: suma de `val_total_pedido` en órdenes completadas
 * 4) Obtiene favoritos del usuario vía `favoritesService.getFavorites(userId)`
 * 5) Obtiene puntos vía `pointsService.getPointsPerUser()`
 *
 * Nota importante de diseño:
 * - Este hook hace múltiples llamados (orders + favorites + points) y captura errores
 *   por separado para que la UI pueda renderizar aunque una de las fuentes falle.
 */

interface AccountStats {
  totalSpent: number
  completedOrders: number
  favoriteProducts: number
  loyaltyPoints: number
}

/**
 * @param userId Identificador del usuario (string o number).
 * @returns React Query con datos calculados y estados de loading/error.
 */
export function useAccountStats(userId?: string | number) {
  return useQuery({
    queryKey: ['account-stats', userId],
    queryFn: async (): Promise<AccountStats> => {
      if (!userId) {
        // No se puede resolver el usuario -> no tiene sentido llamar APIs.
        return {
          totalSpent: 0,
          completedOrders: 0,
          favoriteProducts: 0,
          loyaltyPoints: 0,
        }
      }

      // Obtener órdenes del usuario
      let orders: Order[] = []
      try {
        // Endpoint genérico para listar órdenes del usuario actual.
        // El backend típicamente filtra por sesión/usuario autenticado.
        orders = await get<Order[]>(`/orders`)
      } catch (error) {
        // Si no hay órdenes o hay un error, usar lista vacía
        console.log('No se encontraron órdenes o error al obtenerlas:', error)
        orders = []
      }
      
      // Calcular total gastado y órdenes completadas
      // ind_estado = 2 significa completada
      const completedOrders = orders.filter(order => order.ind_estado === 2)
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + (Number(order.val_total_pedido) || 0),
        0
      )
      const completedOrdersCount = completedOrders.length

      // Obtener favoritos del usuario
      let favoriteProductsCount = 0
      try {
        // Se asume que el backend retorna el listado de productos favoritos.
        const favorites = await favoritesService.getFavorites(Number(userId))
        favoriteProductsCount = favorites.length
      } catch (error) {
        // Si no hay favoritos o hay un error, usar 0
        console.log('No se encontraron favoritos o error al obtenerlos:', error)
        favoriteProductsCount = 0
      }

      // Obtener puntos del usuario
      let loyaltyPoints = 0
      try {
        // `pointsService` normaliza el consumo del endpoint del backend.
        // Retorna `puntos_disponibles` que aquí convertimos a número.
        const pointsData = await pointsService.getPointsPerUser()
        loyaltyPoints = Number(pointsData.puntos_disponibles) || 0
      } catch (error) {
        // Si no tiene puntos, queda en 0
        console.log('Usuario sin puntos registrados')
      }

      return {
        totalSpent,
        completedOrders: completedOrdersCount,
        favoriteProducts: favoriteProductsCount,
        loyaltyPoints,
      }
    },
    // Solo se ejecuta si `userId` es resoluble.
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

