'use client';

import { useRefreshToken } from '@/hooks/use-refresh-token';

export function RefreshTokenProvider({ children }: { children: React.ReactNode }) {
  useRefreshToken();
  
  return <>{children}</>;
} 