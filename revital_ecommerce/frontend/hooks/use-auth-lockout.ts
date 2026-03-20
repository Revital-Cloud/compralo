"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type AuthLimiterConfig,
  getLockoutState,
  remainingLockoutSeconds,
} from "@/lib/auth-attempt-limiter";

/**
 * Re-evaluates lockout from sessionStorage every second while `storageKey` is set.
 * No lee sessionStorage hasta después del montaje para evitar hydration mismatch (SSR vs cliente).
 */
export function useAuthLockout(
  storageKey: string | null,
  config: AuthLimiterConfig,
): { isLocked: boolean; remainingSeconds: number } {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !storageKey) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [mounted, storageKey]);

  return useMemo(() => {
    if (!mounted || !storageKey) {
      return { isLocked: false, remainingSeconds: 0 };
    }
    const state = getLockoutState(storageKey);
    const remainingSeconds = remainingLockoutSeconds(state);
    return {
      isLocked: state.remainingMs > 0,
      remainingSeconds,
    };
  }, [storageKey, config, tick, mounted]);
}
