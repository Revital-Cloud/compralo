'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React, { useState } from 'react'
import { toast } from 'sonner'

/**
 * Provider de React Query con configuración optimizada
 * 
 * Configura el cliente de React Query con manejo de errores,
 * políticas de retry y cache management.
 */
const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  // Crear el QueryClient con configuración optimizada
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que los datos se consideran frescos (sin refetch automático)
            staleTime: 1000 * 60 * 5, // 5 minutos
            
            // Tiempo que los datos permanecen en cache
            gcTime: 1000 * 60 * 30, // 30 minutos (antes era cacheTime)
            
            // Política de retry para queries
            retry: (failureCount, error: any) => {
              // No reintentar para errores 4xx (problemas del cliente)
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              
              // Reintentar máximo 3 veces para otros errores
              return failureCount < 3;
            },
            
            // Delay entre reintentos (exponential backoff)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // No refetch automático al enfocar la ventana
            refetchOnWindowFocus: false,
            
            // Refetch al reconectar la red
            refetchOnReconnect: true,
          },
          mutations: {
            // Configuración global para mutations
            retry: false, // No reintentar mutations por defecto
            
            // Manejo global de errores en mutations
            onError: (error: any) => {
              // Solo mostrar toast si la mutation no maneja el error específicamente
              if (!error.handled) {
                const message = error?.response?.data?.message || 'Ha ocurrido un error inesperado';
                toast.error(message);
              }
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="right"
        />
      )}
    </QueryClientProvider>
  )
}

export default QueryProvider