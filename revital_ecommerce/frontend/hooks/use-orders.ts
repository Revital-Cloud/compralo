import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { orderService } from '@/services/order.service'
import type { OrderFilters } from '@/types/order'

export const useAllOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', 'admin', 'all', filters],
    queryFn: () => orderService.getAllOrders(filters),
    staleTime: 1000 * 60 * 2, // 2 minutos
    placeholderData: keepPreviousData,
  })
}

export const useOrderStats = () => {
  return useQuery({
    queryKey: ['orders', 'admin', 'stats'],
    queryFn: () => orderService.getOrderStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useOrderDetail = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', 'admin', 'detail', orderId],
    queryFn: () => orderService.getOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: number }) => 
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
