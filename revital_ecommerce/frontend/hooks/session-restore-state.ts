"use client";

import { useSyncExternalStore } from "react";

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
