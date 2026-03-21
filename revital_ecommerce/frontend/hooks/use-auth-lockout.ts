"use client";

import { useEffect, useState } from "react";
import {
  type AuthLimiterConfig,
  getLockoutState,
  remainingLockoutSeconds,
} from "@/lib/auth-attempt-limiter";

/**
 * Lee el bloqueo desde sessionStorage en cada render (sin hydration en SSR: solo tras `mounted`).
 * El intervalo de 1s solo corre mientras hay bloqueo activo, para actualizar la cuenta atrás
 * sin re-renderizar todo el formulario cada segundo en el flujo normal (evita cerrar Popovers
 * anidados del calendario, etc.).
 */
export function useAuthLockout(
  storageKey: string | null,
  _config: AuthLimiterConfig,
): { isLocked: boolean; remainingSeconds: number } {
  const [mounted, setMounted] = useState(false);
  /** Solo se incrementa con el intervalo cuando `isLocked`; fuerza re-renders para el countdown. */
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lockState =
    mounted && storageKey
      ? getLockoutState(storageKey)
      : { remainingMs: 0 as number };
  const isLocked = lockState.remainingMs > 0;
  const remainingSeconds = remainingLockoutSeconds(lockState);

  useEffect(() => {
    if (!mounted || !storageKey || !isLocked) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [mounted, storageKey, isLocked]);

  void tick;

  return { isLocked, remainingSeconds };
}
