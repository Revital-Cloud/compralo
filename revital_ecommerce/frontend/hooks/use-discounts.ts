import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { discountService } from '@/services/discount.service'
import type { Discount } from '@/types/discount'

/**
 * Hooks de descuentos (storefront + admin).
 *
 * Convención de keys:
 * - `discounts` base para administración.
 * - `discounts/active` y `discounts/my-available` para experiencia de tienda.
 */

export const useDiscounts = () => {
  return useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountService.getDiscounts(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useCreateDiscount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => discountService.createDiscount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] })
    },
  })
}

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
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

// Admin hooks
export const useDiscountStats = () => {
  return useQuery({
    queryKey: ['discounts', 'admin', 'stats'],
    queryFn: () => discountService.getDiscountStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useDiscountExchanges = (discountId: string) => {
  return useQuery({
    queryKey: ['discounts', 'admin', 'exchanges', discountId],
    queryFn: () => discountService.getDiscountExchanges(discountId),
    enabled: !!discountId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}

// Hook para obtener descuentos activos disponibles para usuarios
export const useActiveDiscounts = (limit: number = 50) => {
  return useQuery({
    queryKey: ['discounts', 'active', limit],
    queryFn: () => discountService.getActiveDiscounts(limit),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para obtener descuentos disponibles para el usuario autenticado (incluye cumpleaños y primera compra)
export const useMyAvailableDiscounts = (limit: number = 50, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['discounts', 'my-available', limit],
    queryFn: () => discountService.getMyAvailableDiscounts(limit),
    staleTime: 1000 * 60 * 2, // 2 minutos (más corto porque depende del estado del usuario)
    retry: false,
    enabled: options?.enabled !== false,
  })
}