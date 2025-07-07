'use client';
import { useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { verifyToken } from '@/services/auth.service';
import { isAuthenticated } from '@/utils/apiWrapper';

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