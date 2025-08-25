'use client';

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

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
  const router = useRouter();
  const { user, isAuthenticated, isLoadingUser, isHydrated } = useAuth();

  // Si no está hidratado o cargando, mostrar loader
  if (!isHydrated || isLoadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Cargando...</span>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    router.replace('/login');
    return fallback || (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-sm text-gray-600">Redirigiendo al login...</span>
      </div>
    );
  }

  // Si se requiere un rol específico, verificar
  if (requiredRole !== undefined) {
    const userRole = Number(user?.id_rol);
    
    if (userRole !== requiredRole) {
      if (redirectTo) {
        router.replace(redirectTo);
      } else {
        router.replace('/');
      }
      
      return fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-sm text-gray-600">Acceso denegado...</span>
        </div>
      );
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
