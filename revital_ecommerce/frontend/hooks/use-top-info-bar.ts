import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { topInfoBarService, type TopInfoBarConfig, type TopInfoBarPayload } from '@/services/top-info-bar.service'

const keys = {
  config: ['top-info-bar', 'config'] as const,
}

export function useTopInfoBarConfig() {
  return useQuery({
    queryKey: keys.config,
    queryFn: () => topInfoBarService.getConfig(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useUpsertTopInfoBar() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (payload: TopInfoBarPayload) => topInfoBarService.upsertConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.config })
    },
  })
}
