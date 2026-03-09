"use client";
import { useEffect, useRef } from "react";
import { useAuth, AUTH_KEYS } from "./use-auth";
import { verifyToken, refreshToken, getCurrentUser } from "@/services/auth.service";
import { isAuthenticated } from "@/utils/apiWrapper";
import { useCookies } from "./use-cookies";
import { useQueryClient } from "@tanstack/react-query";
import { setSessionRestoreStatus } from "./session-restore-state";

/**
 * Hook para mantener la sesión activa mediante verificaciones periódicas
 * 
 * Este hook hace verificaciones periódicas al backend para asegurar que
 * la sesión siga activa. Si el token expira, el interceptor de axios
 * se encarga automáticamente del refresh en la primera petición que falle.
 */

// Intervalo para verificar el estado de autenticación (15 minutos)
const HEALTH_CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutos

export function useRefreshToken() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Solo iniciar verificaciones si el usuario está autenticado
    if (isAuthenticated() && user) {
      // Configurar verificación periódica del estado de autenticación
      intervalRef.current = setInterval(async () => {
        try {
          // Usar el servicio de auth para verificar el token
          // Si el token expira, el interceptor se encargará automáticamente del refresh
          await verifyToken();
        } catch (error) {
          // Si hay error, no hacer nada - el interceptor maneja los errores 401
          // Solo loguear para debugging
          console.debug('Token verification error (handled by interceptor):', error);
        }
      }, HEALTH_CHECK_INTERVAL);
      
      console.log('Auth health check started');
    } else {
      // Limpiar intervalo si el usuario no está autenticado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Auth health check stopped');
      }
    }

    // Cleanup al cambiar dependencias
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user]);

  // Cleanup final al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

/**
 * Hook para restaurar la sesión al cargar la aplicación.
 *
 * - Si hay cookie de refresh y el usuario aceptó cookies necesarias,
 *   intenta llamar a /refresh una sola vez para obtener un nuevo access token.
 * - Si el refresh funciona, precarga el usuario actual en React Query para que
 *   `useAuth` tenga datos y marque al usuario como autenticado sin pedir login.
 */
export function useSessionRestore() {
  const triedRef = useRef(false);
  const { canUseCookie, isHydrated } = useCookies();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Solo intentar una vez por ciclo de vida
    if (triedRef.current) return;
    if (!isHydrated) return;

    triedRef.current = true;

    // Si no se permiten cookies necesarias, no intentamos refresh
    if (!canUseCookie("necessary")) {
      setSessionRestoreStatus({ isRestoring: false, hasAttemptedRestore: true });
      return;
    }

    // Si ya hay token en memoria, no hay nada que restaurar
    if (isAuthenticated()) {
      setSessionRestoreStatus({ isRestoring: false, hasAttemptedRestore: true });
      return;
    }

    setSessionRestoreStatus({ isRestoring: true, hasAttemptedRestore: false });

    (async () => {
      try {
        const tokens = await refreshToken();
        if (!tokens?.access_token) {
          return;
        }

        // Prefetch de usuario actual para hidratar la cache de auth
        await queryClient.fetchQuery({
          queryKey: AUTH_KEYS.currentUser,
          queryFn: getCurrentUser,
        });
      } catch (error) {
        // Sin cookie de refresh o error al refrescar: simplemente no restaurar sesión
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.debug("Session restore failed (likely no refresh cookie):", error);
        }
      } finally {
        setSessionRestoreStatus({ isRestoring: false, hasAttemptedRestore: true });
      }
    })();
  }, [canUseCookie, isHydrated, queryClient]);
}