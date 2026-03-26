/**
 * Hook personalizado para autenticación
 * 
 * Este hook encapsula toda la lógica de autenticación usando React Query
 * para el manejo de estado del servidor y caché automático.
 * 
 * INCLUYE validación de cookies para compliance legal.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import authService from '@/services/auth.service';
import { getApiErrorMessage } from '@/utils/apiWrapper';
import {
  clearFailures,
  loginAttemptKey,
  recordFailure,
  setLockoutUntil,
  LOGIN_ATTEMPT_CONFIG,
  REGISTER_ATTEMPT_CONFIG,
  REGISTER_ATTEMPT_KEY,
} from '@/lib/auth-attempt-limiter';
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
import { useSessionRestoreState } from './session-restore-state';

// Claves de queries para administrar caché de autenticación.
export const AUTH_KEYS = {
  currentUser: ['auth', 'currentUser'] as const,
};

/**
 * Estructura de estados devueltos por `useAuth()`:
 * - `user`: perfil del usuario (o `undefined` si aún no se resolvió).
 * - `isAuthenticated`: derivado de token/cookies + `user` + hidratación.
 * - `isLoadingUser`: indica si la query del perfil está en curso.
 * - `isRestoringSession`: indica si el flujo global de “restore” está en progreso
 *   (ej. al recargar tras refresh).
 *
 * Acciones:
 * - `login`, `logout`, `register`: delegan en `authService`.
 * - `updateProfile`: persiste cambios de perfil y luego invalida/cachea.
 * - `deactivateAccount`: ejecuta soft-delete en backend y fuerza logout + redirect.
 *
 * Mecanismos de seguridad/UX:
 * - Validación de aceptación de cookies antes de ejecutar login/registro.
 * - Manejo de intentos fallidos con lockout temporal (429 + config en `auth-attempt-limiter`).
 * - Flujo especial para `ACCOUNT_SOFT_DELETED` (403) que dispara reactivación por email.
 */

/**
 * Hook principal de autenticación
 * Combina el estado del usuario con las acciones de login/logout.
 * INCLUYE validación de cookies para compliance legal.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { canUseCookie, isHydrated } = useCookies();
  const { isRestoring: isRestoringSession } = useSessionRestoreState();

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

  // Mutación para inicio de sesión.
  const { mutate: login, isPending: isLoggingIn } = useMutation<TokenResponse, unknown, LoginRequest>({
    mutationFn: (credentials: LoginRequest) => {
      // Validar cookies antes de permitir login
      if (!canUseCookie('necessary')) {
        throw new Error('Debes aceptar las cookies necesarias para iniciar sesión');
      }
      return authService.login(credentials);
    },
    onSuccess: async (_data, variables) => {
      if (variables?.email) {
        clearFailures(loginAttemptKey(variables.email));
      }
      toast.success('¡Bienvenido! Has iniciado sesión correctamente');
      
      // Refresca la query del usuario actual para obtener sus datos.
      // Esto es necesario porque el login solo devuelve tokens, no perfil.
      const refreshedUser = await queryClient.fetchQuery<UserPublic>({ queryKey: AUTH_KEYS.currentUser });
      
      // Redirección simplificada después del inicio de sesión.
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
    // Incluye las variables (credenciales) para iniciar flujo de reactivación.
    onError: async (error: any, variables?: LoginRequest) => {
      // Manejar errores específicos de cookies
      if (error.message?.includes('cookies')) {
        toast.error('Para iniciar sesión, debes aceptar las cookies necesarias');
        return;
      }

      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      const code = typeof detail === 'object' ? detail?.code : undefined;

      // Caso especial: cuenta desactivada (borrado lógico) -> inicia reactivación.
      if (status === 403 && code === 'ACCOUNT_SOFT_DELETED' && variables?.email) {
        try {
          await authService.requestAccountReactivation(variables.email);
          toast.error(
            'Tu cuenta ha sido desactivada. Te enviamos un correo para reactivarla. Revisa tu bandeja de entrada.'
          );
        } catch {
          toast.error('Tu cuenta está desactivada y hubo un error al enviar el correo de reactivación.');
        }
        return;
      }

      if (status === 429 && variables?.email) {
        const retryAfter = error?.response?.data?.retry_after;
        let retryAfterSeconds: number | null = null;
        if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
          retryAfterSeconds = Math.max(0, Math.ceil(retryAfter));
        } else if (typeof retryAfter === 'string') {
          const parsed = parseInt(retryAfter, 10);
          if (!Number.isNaN(parsed)) retryAfterSeconds = Math.max(0, parsed);
        }

        if (retryAfterSeconds !== null && retryAfterSeconds > 0) {
          setLockoutUntil(
            loginAttemptKey(variables.email),
            Date.now() + retryAfterSeconds * 1000,
          );
        }
      }

      if (status === 401 && variables?.email) {
        recordFailure(loginAttemptKey(variables.email), LOGIN_ATTEMPT_CONFIG);
      }

      const message = getApiErrorMessage(error, 'Error al iniciar sesión. Verifica tus credenciales.');
      toast.error(message);
    },
  });

  // Mutación para cierre de sesión (invalida cookie y limpia estado local).
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
      clearFailures(REGISTER_ATTEMPT_KEY);
      toast.success('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
    },
    onError: (error: any) => {
      // Manejar errores específicos de cookies
      if (error.message?.includes('cookies')) {
        toast.error('Para crear una cuenta, debes aceptar las cookies necesarias');
        return;
      }
      // No mostrar toast para ACCOUNT_SOFT_DELETED: RegisterForm abre modal de reactivación.
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      const code = typeof detail === 'object' ? detail?.code : undefined;
      if (status === 409 && code === 'ACCOUNT_SOFT_DELETED') {
        throw error;
      }

      if (status === 429) {
        const retryAfter = error?.response?.data?.retry_after;
        let retryAfterSeconds: number | null = null;
        if (typeof retryAfter === 'number' && Number.isFinite(retryAfter)) {
          retryAfterSeconds = Math.max(0, Math.ceil(retryAfter));
        } else if (typeof retryAfter === 'string') {
          const parsed = parseInt(retryAfter, 10);
          if (!Number.isNaN(parsed)) retryAfterSeconds = Math.max(0, parsed);
        }

        if (retryAfterSeconds !== null && retryAfterSeconds > 0) {
          setLockoutUntil(
            REGISTER_ATTEMPT_KEY,
            Date.now() + retryAfterSeconds * 1000,
          );
        }
      }

      if (typeof status === 'number' && status >= 400 && status !== 429) {
        recordFailure(REGISTER_ATTEMPT_KEY, REGISTER_ATTEMPT_CONFIG);
      }
      const message = getApiErrorMessage(error, 'Error al crear la cuenta. Inténtalo de nuevo.');
      toast.error(message);
      throw error; // Relanza el error para que el componente llamador lo maneje.
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (userData: UserUpdate) => {
      if (!user?.id_usuario) {
        throw new Error("Usuario no autenticado");
      }
      return userService.updateUser(user.id_usuario, userData);
    },
    onSuccess: () => {
      // Si la actualización es exitosa, invalida la query de usuario
      // para que React Query vuelva a consultar automáticamente.
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.currentUser });
    },
  });

  const register = async (userData: RegisterRequest) => {
    return await registerMutation.mutateAsync(userData);
  };

  const updateProfile = async (userData: UserUpdate) => {
    await updateProfileMutation.mutateAsync(userData);
  };

  /**
   * Desactiva la cuenta del usuario (soft delete).
   * Llama al backend, hace logout, limpia el estado y redirige al login.
   */
  const deactivateAccount = async () => {
    await authService.deactivateAccount();
    await authService.logout();
    queryClient.clear();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  // Helper para validar si se pueden usar cookies necesarias.
  const canUseCookies = () => canUseCookie('necessary');

  // Estado final de autenticación consumible por UI.
  const isUserAuthenticated = isAuthenticated() && !!user && isHydrated;

  return {
    user,
    isAuthenticated: isUserAuthenticated,
    isLoadingUser,
    isRestoringSession,
    isLoggingIn,
    isLoggingOut,
    userError,
    login,
    logout,
    register,
    updateProfile,
    deactivateAccount,
    canUseCookies: () => canUseCookie('necessary'),
    isHydrated, // Exponer el estado de hidratación
  };
}

/**
 * Hook para cambio de contraseña.
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
 * Hook para solicitar restablecimiento de contraseña.
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
 * Hook para confirmar restablecimiento de contraseña.
 */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (confirmData: ResetPasswordConfirm) => authService.confirmPasswordReset(confirmData),
    onSuccess: () => {
      // El componente se encarga de pintar la UI de éxito/redirección.
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
      // Relanza para que componentes con mutateAsync puedan manejarlo.
      throw error;
    },
  });
}

/**
 * Hook para actualizar perfil del usuario.
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UserUpdate) => userService.updateCurrentUser(userData),
    onSuccess: (updatedUser: UserPublic) => {
      // Actualiza la caché con los nuevos datos.
      queryClient.setQueryData(AUTH_KEYS.currentUser, updatedUser);
      
      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = getApiErrorMessage(error, 'Error al actualizar el perfil. Inténtalo de nuevo.');
      toast.error(message);
    },
  });
} 