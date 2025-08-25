/**
 * Hook personalizado para autenticación
 * 
 * Este hook encapsula toda la lógica de autenticación usando React Query
 * para el manejo de estado del servidor y cache automático.
 * 
 * INCLUYE validación de cookies para compliance legal.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as authService from '@/services/auth.service';
import * as userService from '@/services/user.service';
import { isAuthenticated, clearTokens } from '@/utils/apiWrapper';
import { useCookies } from './use-cookies';
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
 * INCLUYE validación de cookies para compliance legal.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { canUseCookie } = useCookies();

  // Query para obtener el usuario actual
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: AUTH_KEYS.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated() && canUseCookie('necessary'), // Solo ejecutar si hay token Y cookies permitidas
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
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
      const refreshedUser = await queryClient.fetchQuery<User>({ queryKey: AUTH_KEYS.currentUser });
      
      // Redirección basada en rol del usuario
      if (typeof window !== 'undefined') {
        // Convertir id_rol a number para asegurar comparación correcta
        const userRole = Number(refreshedUser?.id_rol);
        
        // Lógica de redireccionamiento:
        // - Rol 1 (Admin): Redirigir al dashboard de administración (/admin)
        // - Rol 2 (Cliente): Redirigir a la tienda principal (/)
        const redirectUrl = userRole === 1 ? '/admin' : '/';
        
        window.location.href = redirectUrl;
      }
    },
    onError: (error: any) => {
      // Manejar errores específicos de cookies
      if (error.message?.includes('cookies')) {
        toast.error('Para iniciar sesión, debes aceptar las cookies necesarias');
        return;
      }
      
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
      
      const message = error?.response?.data?.detail || 'Error al crear la cuenta. Inténtalo de nuevo.';
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

  return {
    user,
    isAuthenticated: isAuthenticated() && !!user && canUseCookie('necessary'),
    isLoadingUser,
    isLoggingIn,
    isLoggingOut,
    userError,
    login,
    logout,
    register,
    updateProfile,
    canUseCookies, // Nueva función para verificar cookies
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