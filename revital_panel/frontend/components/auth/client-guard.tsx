'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Loading from "@/components/ui/loading";

interface ClientGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard component for client-only routes.
 * 
 * - Redirects to /login if not authenticated
 * - Redirects to /admin if user is admin_revital (not a client)
 * - Shows loading state while checking authentication
 */
export function ClientGuard({ children }: ClientGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Only set mounted state after hydration to avoid SSR mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;

    // Derive current locale prefix (e.g. /es) from pathname
    const segments = pathname.split('/');
    const localeSegment = segments[1] || '';
    const localePrefix = localeSegment ? `/${localeSegment}` : '';

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : pathname;
      router.push(
        `${localePrefix}/login?redirect=${encodeURIComponent(currentPath)}`
      );
      return;
    }

    // Check if user is a client (not an admin)
    if (user && user.user_type !== 'cliente') {
      // Admin users should go to admin panel
      router.push(`${localePrefix}/admin`);
      return;
    }
  }, [isAuthenticated, isLoading, user, router, pathname]);

  // Show loading while checking auth or during initial mount
  if (isLoading || !isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or wrong user type - show loading while redirecting
  if (!isAuthenticated || (user && user.user_type !== 'cliente')) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loading size="lg" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Authenticated client - render children
  return <>{children}</>;
}
