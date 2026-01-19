'use client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // El QueryClientProvider ahora está en QueryProvider
  // Este componente solo maneja la autenticación
  return <>{children}</>;
} 