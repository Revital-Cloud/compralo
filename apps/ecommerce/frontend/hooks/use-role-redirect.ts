/**
 * Hook personalizado para manejar redirecciones basadas en roles
 * 
 * Este hook encapsula la lógica de redirección automática dependiendo
 * del rol del usuario autenticado.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export interface RoleRedirectOptions {
  /** Rol requerido para acceder a la página (1 = admin, 2 = cliente) */
  requiredRole?: number;
  /** URL de redirección si no está autenticado */
  loginRedirect?: string;
  /** URL de redirección si no tiene el rol correcto */
  unauthorizedRedirect?: string;
  /** Mensaje a mostrar si no está autenticado */
  loginMessage?: string;
  /** Mensaje a mostrar si no tiene permisos */
  unauthorizedMessage?: string;
  /** Si debe mostrar mensajes de error */
  showMessages?: boolean;
}

const defaultOptions: Required<RoleRedirectOptions> = {
  requiredRole: 2, // Cliente por defecto
  loginRedirect: '/login',
  unauthorizedRedirect: '/',
  loginMessage: 'Debes iniciar sesión para acceder.',
  unauthorizedMessage: 'No tienes permisos para acceder a esta sección.',
  showMessages: true,
};

/**
 * Hook para manejar redirecciones automáticas basadas en roles
 */
export function useRoleRedirect(options: RoleRedirectOptions = {}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingUser } = useAuth();
  
  const config = { ...defaultOptions, ...options };

  useEffect(() => {
    // No hacer nada mientras se está cargando la información del usuario
    if (isLoadingUser) return;

    const userRole = Number(user?.id_rol);
    
    // Solo hacer redirecciones automáticas si se especifica un rol requerido
    if (config.requiredRole) {
      // Verificar autenticación
      if (!isAuthenticated) {
        if (config.showMessages) {
          toast.error(config.loginMessage);
        }
        router.replace(config.loginRedirect);
        return;
      }

      // Verificar rol
      if (userRole !== config.requiredRole) {
        if (config.showMessages) {
          toast.error(config.unauthorizedMessage);
        }
        router.replace(config.unauthorizedRedirect);
        return;
      }
    }
    // Si no hay rol requerido, no hacer redirecciones automáticas
    // El componente padre debe manejar la lógica de redirección
  }, [isLoadingUser, isAuthenticated, user, router, config]);

  return {
    isLoading: isLoadingUser,
    user,
    isAuthenticated,
    userRole: Number(user?.id_rol),
    hasRequiredRole: isAuthenticated && (!config.requiredRole || Number(user?.id_rol) === config.requiredRole),
  };
}

/**
 * Hook específico para páginas de administrador
 */
export function useAdminRedirect() {
  return useRoleRedirect({
    requiredRole: 1,
    loginRedirect: '/login',
    unauthorizedRedirect: '/',
    loginMessage: 'Debes iniciar sesión para acceder al panel de administración.',
    unauthorizedMessage: 'Acceso denegado. No tienes permisos de administrador.',
  });
}

/**
 * Hook específico para páginas de cliente
 */
export function useClientRedirect() {
  return useRoleRedirect({
    requiredRole: 2,
    loginRedirect: '/login',
    unauthorizedRedirect: '/admin',
    loginMessage: 'Debes iniciar sesión para acceder.',
    unauthorizedMessage: 'Esta sección es solo para clientes.',
  });
}

/**
 * Hook para redirección automática después del login
 */
export function useLoginRedirect() {
  const { user, isAuthenticated, isLoadingUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoadingUser) return;
    
    if (isAuthenticated && user) {
      const userRole = Number(user.id_rol);
      
      // Redirección automática después del login
      const redirectUrl = userRole === 1 ? '/admin' : '/';
      
      router.replace(redirectUrl);
    }
  }, [isLoadingUser, isAuthenticated, user, router]);

  return {
    isLoading: isLoadingUser,
    isAuthenticated,
    user,
  };
}
