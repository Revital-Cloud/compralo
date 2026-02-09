'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';
import Loading from '@/components/ui/loading';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard para rutas solo de admins Synkro.
 *
 * - Redirige a /login si no está autenticado
 * - Redirige a /dashboard (cliente) si el usuario no es admin_synkro
 * - Muestra loading mientras se resuelve la autenticación
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const currentPath = pathname || window.location.pathname;
      const localePrefix = `/${locale}`;
      router.push(`${localePrefix}/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (user && user.user_type !== 'admin_synkro') {
      const localePrefix = `/${locale}`;
      router.push(`${localePrefix}/dashboard`);
      return;
    }
  }, [isAuthenticated, isLoading, user, router, pathname, locale]);

  if (isLoading || !isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user && user.user_type !== 'admin_synkro')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

