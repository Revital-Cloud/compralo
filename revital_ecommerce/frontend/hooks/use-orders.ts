import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import type { OrderFilters } from '@/types/order'

/**
 * Hooks de órdenes (frontend).
 *
 * Estos hooks son “puentes” entre UI/Panel admin y `orderService`.
 * Centralizan el manejo de:
 * - `queryKey` (para cache/invalidez)
 * - `enabled` (para evitar llamadas con parámetros vacíos)
 * - `placeholderData` con `keepPreviousData` para UX suave al cambiar filtros
 * - invalidación tras mutaciones (actualizar listados luego de cambios de estado)
 *
 * Estrategia de caché:
 * - Listados con `keepPreviousData` para UX fluida en paginación/filtros.
 * - Invalidación global por prefijo `orders` tras mutaciones de estado.
 */

export const useAllOrders = (filters?: OrderFilters) => {
  return useQuery({
    // `filters` entra en queryKey para que cada combinación sea caché independiente.
    queryKey: ['orders', 'admin', 'all', filters],
    // Endpoint de backend para listar órdenes (para admin).
    queryFn: () => orderService.getAllOrders(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
    // Evita “parpadeos” al cambiar filtros: mantiene el resultado anterior mientras llega el nuevo.
    placeholderData: keepPreviousData,
  })
}

export const useOrderStats = () => {
  return useQuery({
    // Stats tienen su propio key para no mezclar con listados/detalles.
    queryKey: ['orders', 'admin', 'stats'],
    // Endpoint que calcula KPIs/estadísticas.
    queryFn: () => orderService.getOrderStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useOrderDetail = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', 'admin', 'detail', orderId],
    // Evita request si `orderId` viene vacío/inválido.
    queryFn: () => orderService.getOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    // Mutación que actualiza `ind_estado` (o equivalente) de la orden.
    mutationFn: ({ orderId, status }: { orderId: string; status: number }) => 
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      // Simplificación: invalidamos cualquier consulta que empiece con `orders`
      // para que la UI se sincronice con el nuevo estado.
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
