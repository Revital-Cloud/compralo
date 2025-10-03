import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { discountService, DiscountCreate, DiscountUpdate } from '@/services/discount.service'
import { useAuth } from './use-auth'

export const useDiscounts = () => {
  return useQuery({
    queryKey: ['discounts', 'all'],
    queryFn: () => discountService.getDiscounts(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useExchangeableDiscounts = (limit: number = 20) => {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['discounts', 'exchangeable', user?.id_usuario, limit],
    queryFn: () => discountService.getExchangeableDiscounts(user?.id_usuario || '', limit),
    enabled: !!user?.id_usuario,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

export const useCreateDiscount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: DiscountCreate) => discountService.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    },
  })
}

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DiscountUpdate }) => 
      discountService.updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    },
  })
}

export const useToggleDiscountStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, activate }: { id: string; activate: boolean }) => 
      discountService.toggleDiscountStatus(id, activate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    },
  })
}

