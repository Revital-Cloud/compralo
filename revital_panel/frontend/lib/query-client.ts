'use client';

import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import type { ApiError } from '@/types/errors';

const defaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount: number, error: unknown) => {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status != null && err.response.status >= 400 && err.response.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: false,
    onError: (error: unknown) => {
      const apiError = error as ApiError & { handled?: boolean };
      if (!apiError?.handled) {
        toast.error(getErrorMessage(error, 'Ha ocurrido un error inesperado'));
      }
    },
  },
} as const;

let client: QueryClient | undefined;

/**
 * Singleton QueryClient para toda la app.
 * Garantiza que layouts anidados (p. ej. dashboard) tengan acceso al mismo cliente.
 */
export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    return new QueryClient({ defaultOptions });
  }
  if (!client) {
    client = new QueryClient({ defaultOptions });
  }
  return client;
}
