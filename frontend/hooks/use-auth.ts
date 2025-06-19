/**
 * Hook personalizado para autenticación
 * 
 * Este hook encapsula toda la lógica de autenticación usando React Query
 * para el manejo de estado del servidor y cache automático.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import { isAuthenticated } from '@/utils/apiWrapper';
import type {
  LoginRequest,
  TokenResponse,
  User,
  RegisterRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  UserUpdate,
} from '@/types';

// Keys para las queries (para cache management)
export const AUTH_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
  isAuthenticated: ['auth', 'isAuthenticated'] as const,
};

/**
 * Hook principal de autenticación
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // Query para obtener el usuario actual
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser
  } = useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: () => userService.getCurrentUser(),
    enabled: isAuthenticated(), // Solo ejecutar si hay token
    retry: false, // No reintentar si falla (probablemente token inválido)
    staleTime: 5 * 60 * 1000, // Considerar datos frescos por 5 minutos
  });

  // Verificar si está autenticado
  const isUserAuthenticated = isAuthenticated() && !!user;

  return {
    user,
    isAuthenticated: isUserAuthenticated,
    isLoadingUser,
    userError,
    refetchUser,
  };
}

/**
 * Hook para operaciones de login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data: TokenResponse) => {
      // Mostrar mensaje de éxito
      toast.success('¡Bienvenido! Has iniciado sesión correctamente');
      
      // Invalidar queries relacionadas con auth para refrescar datos
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
      
      // Opcional: redirigir a dashboard o página principal
      if (typeof window !== 'undefined') {
        // Puedes cambiar esta ruta según tu aplicación
        window.location.href = '/dashboard';
      }
    },
    onError: (error: any) => {
      // Manejar errores de login
      const message = error?.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      toast.error(message);
    },
  });
}

/**
 * Hook para registro de usuarios
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data: User) => {
      toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
      
      // Opcional: redirigir a login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
      toast.error(message);
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      // El logout es una operación local (limpia tokens)
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Limpiar toda la cache
      queryClient.clear();
      
      toast.success('Has cerrado sesión correctamente');
      
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });
}

/**
 * Hook para cambio de contraseña
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (passwordData: ChangePasswordRequest) => authService.changePassword(passwordData),
    onSuccess: () => {
      toast.success('Contraseña cambiada exitosamente');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(message);
    },
  });
}

/**
 * Hook para solicitar reset de contraseña
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (resetData: ResetPasswordRequest) => authService.requestPasswordReset(resetData),
    onSuccess: () => {
      toast.success('Se ha enviado un enlace de recuperación a tu email');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al enviar el enlace de recuperación';
      toast.error(message);
    },
  });
}

/**
 * Hook para confirmar reset de contraseña
 */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (confirmData: ResetPasswordConfirm) => authService.confirmPasswordReset(confirmData),
    onSuccess: () => {
      toast.success('Contraseña restablecida exitosamente. Ya puedes iniciar sesión.');
      
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al restablecer la contraseña';
      toast.error(message);
    },
  });
}

/**
 * Hook para actualizar perfil del usuario
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UserUpdate) => userService.updateCurrentUser(userData),
    onSuccess: (updatedUser: User) => {
      // Actualizar la cache con los nuevos datos
      queryClient.setQueryData(AUTH_KEYS.currentUser, updatedUser);
      
      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(message);
    },
  });
} 