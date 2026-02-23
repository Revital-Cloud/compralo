'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';
import { getQueryClient } from '@/lib/query-client';

/**
 * Provider de React Query con configuración optimizada.
 * Usa un QueryClient compartido para que hooks (p. ej. useAuth) tengan contexto en todos los layouts.
 */
const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

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
  );
};

export default QueryProvider;
