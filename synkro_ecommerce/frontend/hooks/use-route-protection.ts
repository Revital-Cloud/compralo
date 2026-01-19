import { useMemo } from 'react';
import { useAuth } from './use-auth';
import { useRouter } from 'next/navigation';

export function useRouteProtection(requiredRole?: number) {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingUser, isHydrated } = useAuth();

  const routeStatus = useMemo(() => {
    // Si no está hidratado o cargando
    if (!isHydrated || isLoadingUser) {
      return {
        status: 'loading' as const,
        shouldRender: false,
        message: 'Cargando...'
      };
    }

    // Si no está autenticado
    if (!isAuthenticated) {
      router.replace('/login');
      return {
        status: 'redirecting' as const,
        shouldRender: false,
        message: 'Redirigiendo al login...'
      };
    }

    // Si se requiere un rol específico
    if (requiredRole !== undefined) {
      const userRole = Number(user?.id_rol);
      
      if (userRole !== requiredRole) {
        const redirectTo = requiredRole === 1 ? '/' : '/admin';
        router.replace(redirectTo);
        
        return {
          status: 'unauthorized' as const,
          shouldRender: false,
          message: 'Acceso denegado...'
        };
      }
    }

    // Si pasa todas las verificaciones
    return {
      status: 'authorized' as const,
      shouldRender: true,
      message: ''
    };
  }, [isHydrated, isLoadingUser, isAuthenticated, user, requiredRole, router]);

  return routeStatus;
}

// Hooks específicos para diferentes tipos de protección
export function useAdminProtection() {
  return useRouteProtection(1);
}

export function useClientProtection() {
  return useRouteProtection(2);
}

export function useAuthProtection() {
  return useRouteProtection();
}
