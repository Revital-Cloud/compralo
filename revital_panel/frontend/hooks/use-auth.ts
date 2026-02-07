/**
 * Hook personalizado para autenticación
 * 
 * Este hook encapsula toda la lógica de autenticación usando React Query
 * para el manejo de estado del servidor y cache automático.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import authService from '@/services/auth.service';
import { isAuthenticated, clearTokens, getStoredRefreshToken } from '@/utils/apiWrapper';
import { getErrorMessage } from '@/types/errors';
import type {
  LoginRequest,
  TokenResponse,
  UserInToken,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  RegisterRequest,
} from '@/types';

// Keys para las queries (para cache management)
export const AUTH_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
};

/**
 * Hook principal de autenticación
 * Combina el estado del usuario con las acciones de login/logout.
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // Query para obtener el usuario actual
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    user,
    isAuthenticated: isAuthenticated() && !!user,
    isLoading: isLoadingUser,
    error: userError,
  };
}

/**
 * Hook para login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async () => {
      toast.success('¡Bienvenido! Has iniciado sesión correctamente');
      
      // Refresca la query del usuario actual para obtener sus datos (una sola vez)
      const refreshedUser = await queryClient.fetchQuery<UserInToken>({ 
        queryKey: AUTH_KEYS.currentUser 
      });
      
      // Redirección después del login
      if (typeof window !== 'undefined' && refreshedUser) {
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        // Redirigir si estamos en la página de login (con o sin locale)
        if (currentPath === '/login' || currentPath.endsWith('/login')) {
          let targetUrl = '/dashboard'; // Por defecto al dashboard para clientes
          
          if (redirectTo && redirectTo.startsWith('/')) {
            targetUrl = redirectTo;
          } else if (refreshedUser.user_type === 'admin_revital') {
            targetUrl = '/admin';
          }
          
          window.location.href = targetUrl;
        }
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al iniciar sesión'));
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        try {
          await authService.logoutWithToken(refreshToken);
        } catch (error) {
          // Si falla el logout en el servidor, continuar con el logout local
          console.error('Error al cerrar sesión en el servidor:', error);
        }
      }
      authService.logout();
    },
    onSuccess: () => {
      // Limpiar todas las queries del cache
      queryClient.clear();
      toast.success('Sesión cerrada correctamente');
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: (error: any) => {
      // Aún así hacer logout local
      authService.logout();
      queryClient.clear();
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Error al cerrar sesión';
      toast.error(message);
    },
  });
}

/**
 * Hook para refresh token
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: () => authService.refreshToken(),
    onError: (error: unknown) => {
      console.error('Error al refrescar token:', error);
      clearTokens();
    },
  });
}

/**
 * Hook para cambio de contraseña
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al cambiar contraseña'));
    },
  });
}

/**
 * Hook para solicitar reset de contraseña
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.requestPasswordReset(data),
    onSuccess: () => {
      toast.success('Si el email existe, recibirás instrucciones para resetear tu contraseña');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al solicitar reset de contraseña'));
    },
  });
}

/**
 * Hook para confirmar reset de contraseña
 */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (data: ResetPasswordConfirm) => authService.confirmPasswordReset(data),
    onSuccess: () => {
      toast.success('Contraseña restablecida correctamente');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Error al restablecer contraseña'));
    },
  });
}

/**
 * Hook for user registration (public)
 * Creates a new client account and auto-login
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: async () => {
      toast.success('Account created successfully! Welcome to Revital.');
      
      // Fetch user data after registration
      await queryClient.fetchQuery<UserInToken>({ 
        queryKey: AUTH_KEYS.currentUser 
      });
      
      // Redirect to dashboard
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create account'));
    },
  });
}
