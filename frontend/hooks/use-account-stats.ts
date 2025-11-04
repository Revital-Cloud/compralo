import { useQuery } from '@tanstack/react-query'
import { get } from '@/utils/apiWrapper'
import { favoritesService } from '@/services/favorites.service'
import { pointsService } from '@/services/points.service'
import type { Order } from '@/types/order'
import type { PointsPerUser } from '@/types/points'

interface AccountStats {
  totalSpent: number
  completedOrders: number
  favoriteProducts: number
  loyaltyPoints: number
}

export function useAccountStats(userId?: string | number) {
  return useQuery({
    queryKey: ['account-stats', userId],
    queryFn: async (): Promise<AccountStats> => {
      if (!userId) {
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
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

