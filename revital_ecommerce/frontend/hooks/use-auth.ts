/**
 * Hook personalizado para autenticación
 * 
 * Este hook encapsula toda la lógica de autenticación usando React Query
 * para el manejo de estado del servidor y cache automático.
 * 
 * INCLUYE validación de cookies para compliance legal.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import authService from '@/services/auth.service';
import { getApiErrorMessage } from '@/utils/apiWrapper';
import * as userService from '@/services/user.service';
import { isAuthenticated, clearTokens } from '@/utils/apiWrapper';
import { useCookies } from './use-cookies';
import type {
  LoginRequest,
  TokenResponse,
  UserPublic,
  ChangePasswordRequest,
  ResetPasswordRequest,
  ResetPasswordConfirm,
  UserUpdate,
  RegisterRequest,
} from '@/types';
import { useEffect } from 'react';

// Keys para las queries (para cache management)
export const AUTH_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
};

/**
 * Hook principal de autenticación
 * Combina el estado del usuario con las acciones de login/logout.
 * INCLUYE validación de cookies para compliance legal.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { canUseCookie, isHydrated } = useCookies();

  // Query para obtener el usuario actual
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated() && isHydrated, // Simplificado: solo verificar token y hidratación
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Mutación para login
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: (credentials: LoginRequest) => {
      // Validar cookies antes de permitir login
      if (!canUseCookie('necessary')) {
        throw new Error('Debes aceptar las cookies necesarias para iniciar sesión');
      }
      return authService.login(credentials);
    },
    onSuccess: async () => {
      toast.success('¡Bienvenido! Has iniciado sesión correctamente');
      
      // Refresca la query del usuario actual para obtener sus datos
      // Esto es necesario porque el login solo devuelve tokens, no datos del usuario
      const refreshedUser = await queryClient.fetchQuery<UserPublic>({ queryKey: AUTH_KEYS.currentUser });
      
      // Redirección simplificada después del login
      if (typeof window !== 'undefined') {
        // Convertir id_rol a number para asegurar comparación correcta
        const userRole = Number(refreshedUser?.id_rol);
        
        // Obtener la URL actual y los parámetros
        const currentPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect');
        
        // Solo hacer redirección desde páginas de autenticación
        if (currentPath === '/login' || currentPath === '/register') {
          let targetUrl = '/'; // Por defecto, ir a la página principal
          
          if (redirectTo && redirectTo.startsWith('/')) {
            // Si hay un parámetro redirect válido, usarlo
            targetUrl = redirectTo;
          } else if (userRole === 1) {
            // Si es admin, ir al panel de administración
            targetUrl = '/admin';
          }
          // Navegación cliente (sin recarga) para no perder el token en memoria (SEC-001)
          router.replace(targetUrl);
        }
        // En otros casos, no redirigir automáticamente
        // Los layouts se encargarán de la redirección según el contexto
      }
    },
    onError: (error: any) => {
      // Manejar errores específicos de cookies
      if (error.message?.includes('cookies')) {
        toast.error('Para iniciar sesión, debes aceptar las cookies necesarias');
        return;
      }
      
      const message = getApiErrorMessage(error, 'Error al iniciar sesión. Verifica tus credenciales.');
      toast.error(message);
    },
  });

  // Mutación para logout (invalida cookie en backend y limpia token en memoria)
  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
    onError: () => {
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
    }
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterRequest) => {
      // Validar cookies antes de permitir registro
      if (!canUseCookie('necessary')) {
        throw new Error('Debes aceptar las cookies necesarias para crear una cuenta');
      }
      return authService.register(userData);
    },
    onSuccess: () => {
      toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
    },
    onError: (error: any) => {
      // Manejar errores específicos de cookies
      if (error.message?.includes('cookies')) {
        toast.error('Para crear una cuenta, debes aceptar las cookies necesarias');
        return;
      }
      
      const message = getApiErrorMessage(error, 'Error al crear la cuenta. Inténtalo de nuevo.');
      toast.error(message);
      throw error; // Re-lanzar el error para que el componente lo pueda manejar
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (userData: UserUpdate) => {
      if (!user?.id_usuario) {
        throw new Error("User not authenticated");
      }
      return userService.updateUser(user.id_usuario, userData);
    },
    onSuccess: () => {
      // Si la actualización es exitosa, invalidamos la query de 'user'
      // para que React Query la vuelva a fetchear automáticamente.
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
    },
  });

  const register = async (userData: RegisterRequest) => {
    return await registerMutation.mutateAsync(userData);
  };

  const updateProfile = async (userData: UserUpdate) => {
    await updateProfileMutation.mutateAsync(userData);
  };

  // Función helper para verificar si se pueden usar cookies
  const canUseCookies = () => canUseCookie('necessary');

  // Lógica simplificada de autenticación
  const isUserAuthenticated = isAuthenticated() && !!user && isHydrated;

  return {
    user,
    isAuthenticated: isUserAuthenticated,
    isLoadingUser,
    isLoggingIn,
    isLoggingOut,
    userError,
    login,
    logout,
    register,
    updateProfile,
    canUseCookies: () => canUseCookie('necessary'),
    isHydrated, // Exponer el estado de hidratación
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
      // El componente se encarga de mostrar la UI de éxito / redirección
      toast.success('Contraseña restablecida exitosamente. Ya puedes iniciar sesión.');
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const message =
        data?.detail ||
        data?.message ||
        error?.message ||
        'Error al restablecer la contraseña';
      toast.error(message);
      // Re-lanzar para que los componentes que usen mutateAsync puedan manejarlo
      throw error;
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
    onSuccess: (updatedUser: UserPublic) => {
      // Actualizar la cache con los nuevos datos
      queryClient.setQueryData(AUTH_KEYS.currentUser, updatedUser);
      
      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error, 'Error al actualizar el perfil. Inténtalo de nuevo.');
      toast.error(message);
    },
  });
} 