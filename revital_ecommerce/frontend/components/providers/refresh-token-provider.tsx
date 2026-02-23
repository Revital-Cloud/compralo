"use client";

import { useRefreshToken, useSessionRestore } from "@/hooks/use-refresh-token";

export function RefreshTokenProvider({ children }: { children: React.ReactNode }) {
  // Restaurar sesión al cargar la app (si hay cookie de refresh)
  useSessionRestore();
  // Mantener la sesión viva con verificaciones periódicas
  useRefreshToken();

  return <>{children}</>;
}