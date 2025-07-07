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
import { isAuthenticated, clearTokens } from '@/utils/apiWrapper';
import type {
  LoginRequest,
  TokenResponse,
  User,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  UserUpdate,
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
    enabled: isAuthenticated(), // Solo ejecutar si hay token
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutación para login
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async () => {
      toast.success('¡Bienvenido! Has iniciado sesión correctamente');
      // Refresca la query del usuario actual para obtener sus datos
      const refreshedUser = await queryClient.fetchQuery<User>({ queryKey: AUTH_KEYS.currentUser });
      
      // Redirección basada en rol
      if (typeof window !== 'undefined') {
        // Rol 1: Admin -> /admin
        // Otro rol -> / (tienda)
        window.location.href = refreshedUser?.id_rol === 1 ? '/admin' : '/';
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || 'Error al iniciar sesión. Verifica tus credenciales.';
      toast.error(message);
    },
  });

  // Mutación para logout
  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      // Idealmente, aquí se podría llamar a un endpoint de /logout del backend si lo hubiera
      // Por ahora, es una operación del lado del cliente
      clearTokens();
    },
    onSuccess: () => {
      // Limpiar toda la cache de React Query para desloguear completamente
      queryClient.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login'; // Redirigir siempre al login
      }
    },
    onError: () => {
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
    }
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
  });

  const register = async (userData: RegisterRequest) => {
    await registerMutation.mutateAsync(userData);
  };

  return {
    user,
    isAuthenticated: isAuthenticated() && !!user,
    isLoadingUser,
    isLoggingIn,
    isLoggingOut,
    userError,
    login,
    logout,
    register,
  };
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