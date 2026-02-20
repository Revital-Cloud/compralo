'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/hooks/use-auth';
import Loading from '@/components/ui/loading';

interface LandingGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps the landing (home) page. When the user is logged in,
 * redirects to dashboard so the landing is never shown.
 * Shows loading while auth is being checked.
 */
export function LandingGuard({ children }: LandingGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      if (user.user_type === 'admin_revital') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // While loading or when logged in (redirecting), show loading so we never flash the landing
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
