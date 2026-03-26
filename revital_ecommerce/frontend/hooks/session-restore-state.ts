"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado global (a nivel de módulo) para el “restore” de sesión.
 *
 * Motivo:
 * - Cuando el usuario recarga la página, parte del estado de auth depende de cookies/tokens
 *   y de un restore que se ejecuta async.
 * - Este archivo permite que múltiples componentes compartan dos flags:
 *   - `isRestoring`: hay un restore en progreso
 *   - `hasAttemptedRestore`: el restore ya se intentó (evita redirects prematuros)
 *
 * Por qué `useSyncExternalStore`:
 * - React requiere una forma consistente de suscribirse a un store externo para evitar
 *   desajustes entre render y snapshots.
 */
type SessionRestoreStatus = {
  isRestoring: boolean;
  hasAttemptedRestore: boolean;
};

let sessionRestoreStatus: SessionRestoreStatus = {
  isRestoring: false,
  hasAttemptedRestore: false,
};

const sessionRestoreListeners = new Set<() => void>();

export function setSessionRestoreStatus(next: Partial<SessionRestoreStatus>) {
  sessionRestoreStatus = { ...sessionRestoreStatus, ...next };
  sessionRestoreListeners.forEach((listener) => listener());
}

function subscribeToSessionRestore(listener: () => void) {
  sessionRestoreListeners.add(listener);
  return () => sessionRestoreListeners.delete(listener);
}

function getSessionRestoreSnapshot() {
  return sessionRestoreStatus;
}

export function useSessionRestoreState() {
  return useSyncExternalStore(
    subscribeToSessionRestore,
    getSessionRestoreSnapshot,
    getSessionRestoreSnapshot
  );
}
