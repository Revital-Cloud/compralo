'use client';

import { useAuth } from "@/hooks/use-auth";
import { useSessionRestoreState } from "@/hooks/session-restore-state";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

/**
 * Guard de rutas cliente por autenticación/rol.
 *
 * Casos:
 * - `AuthGuard`: requiere sesión.
 * - `AdminGuard`: requiere rol admin.
 * - `ClientGuard`: requiere rol cliente.
 */

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: number;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  fallback,
  redirectTo 
}: RouteGuardProps) {
  const { user, isAuthenticated, isLoadingUser, isHydrated } = useAuth();
  const { isRestoring, hasAttemptedRestore } = useSessionRestoreState();

  // Si no está hidratado o cargando, mostrar loader
  // Importante: en refresh el token de acceso está en memoria y se pierde hasta
  // que `useSessionRestore()` llame a `/refresh`. Si redirigimos antes,
  // terminamos en el index de `/admin` y perdemos la ruta actual.
  if (!isHydrated || isLoadingUser || isRestoring || !hasAttemptedRestore) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Cargando...</span>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    redirect('/login');
  }

  // Si se requiere un rol específico, verificar
  if (requiredRole !== undefined) {
    const userRole = Number(user?.id_rol);
    
    if (userRole !== requiredRole) {
      if (redirectTo) {
        redirect(redirectTo);
      } else {
        redirect('/');
      }
    }
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>;
}

// Componentes específicos para diferentes tipos de protección
export function AdminGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RouteGuard requiredRole={1} redirectTo="/" fallback={fallback}>
      {children}
    </RouteGuard>
  );
}

export function ClientGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RouteGuard requiredRole={2} redirectTo="/admin" fallback={fallback}>
      {children}
    </RouteGuard>
  );
}

export function AuthGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RouteGuard fallback={fallback}>
      {children}
    </RouteGuard>
  );
}
