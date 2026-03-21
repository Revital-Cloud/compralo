/**
 * Client-side auth attempt tracking (sessionStorage).
 * Complements server rate limits; not a security boundary.
 */

const STORAGE_PREFIX = "auth_attempts:";

export type AuthLimiterConfig = {
  maxFailures: number;
  lockoutMs: number;
};

/** Login: lock after N wrong passwords per email (this browser tab). */
export const LOGIN_ATTEMPT_CONFIG: AuthLimiterConfig = {
  maxFailures: 5,
  lockoutMs: 15 * 60 * 1000,
};

/** Register: lock after N failed submissions in this tab. */
export const REGISTER_ATTEMPT_CONFIG: AuthLimiterConfig = {
  maxFailures: 5,
  lockoutMs: 15 * 60 * 1000,
};

export const REGISTER_ATTEMPT_KEY = "register";

export function loginAttemptKey(email: string): string {
  return `login:${email.trim().toLowerCase()}`;
}

/** Extrae el email de una clave `login:correo@...`. */
export function emailFromLoginAttemptKey(key: string): string | null {
  const prefix = "login:";
  if (!key.startsWith(prefix)) return null;
  const rest = key.slice(prefix.length).trim();
  return rest.length > 0 ? rest : null;
}

/**
 * Si hay un bloqueo de login activo guardado (p. ej. tras recargar la página con el campo vacío),
 * devuelve su clave lógica (`login:email`).
 */
export function getActiveLoginLockoutStorageKey(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  for (let i = 0; i < sessionStorage.length; i++) {
    const full = sessionStorage.key(i);
    if (!full?.startsWith(STORAGE_PREFIX + "login:")) continue;
    const logicalKey = full.slice(STORAGE_PREFIX.length);
    const state = getLockoutState(logicalKey);
    if (state.remainingMs > 0) return logicalKey;
  }
  return null;
}

/**
 * Clave de bloqueo a usar en la UI: la del email escrito si está bloqueada;
 * si el campo está vacío, cualquier bloqueo `login:*` aún vigente (persiste al refrescar).
 */
export function resolveLoginLockoutKey(emailWatched: string): string | null {
  const trimmed = emailWatched.trim();
  if (trimmed.length > 0) {
    const k = loginAttemptKey(trimmed);
    if (getLockoutState(k).remainingMs > 0) return k;
    return null;
  }
  return getActiveLoginLockoutStorageKey();
}

type StoredState = {
  failures: number;
  lockedUntil: number | null;
};

function readState(key: string): StoredState {
  if (typeof sessionStorage === "undefined") {
    return { failures: 0, lockedUntil: null };
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return { failures: 0, lockedUntil: null };
    const p = JSON.parse(raw) as Partial<StoredState>;
    return {
      failures: typeof p.failures === "number" ? p.failures : 0,
      lockedUntil: typeof p.lockedUntil === "number" ? p.lockedUntil : null,
    };
  } catch {
    return { failures: 0, lockedUntil: null };
  }
}

function writeState(key: string, state: StoredState): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
}

function normalizeAfterExpiry(state: StoredState): StoredState {
  const now = Date.now();
  if (state.lockedUntil !== null && now >= state.lockedUntil) {
    return { failures: 0, lockedUntil: null };
  }
  return state;
}

export type LockoutState = StoredState & { remainingMs: number };

export function getLockoutState(key: string): LockoutState {
  const prev = readState(key);
  const state = normalizeAfterExpiry(prev);
  if (state.lockedUntil !== prev.lockedUntil || state.failures !== prev.failures) {
    writeState(key, state);
  }
  const now = Date.now();
  const remainingMs =
    state.lockedUntil !== null ? Math.max(0, state.lockedUntil - now) : 0;
  return { ...state, remainingMs };
}

export function recordFailure(key: string, config: AuthLimiterConfig): StoredState {
  let state = normalizeAfterExpiry(readState(key));
  const now = Date.now();
  if (state.lockedUntil !== null && now < state.lockedUntil) {
    return state;
  }
  state.failures += 1;
  if (state.failures >= config.maxFailures) {
    state = { failures: 0, lockedUntil: now + config.lockoutMs };
  }
  writeState(key, state);
  return state;
}

/**
 * Establece un lockout hasta una fecha/hora (ms desde epoch).
 * Se usa también para bloquear la UI cuando el backend responde 429.
 */
export function setLockoutUntil(key: string, untilMs: number): StoredState {
  const now = Date.now();
  const target = Math.max(now, untilMs);
  const state = normalizeAfterExpiry(readState(key));
  if (target <= now) {
    return { ...state, lockedUntil: null, failures: 0 };
  }
  const next: StoredState = { ...state, lockedUntil: target };
  writeState(key, next);
  return next;
}

export function clearFailures(key: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_PREFIX + key);
}

export function remainingLockoutSeconds(state: Pick<LockoutState, "remainingMs">): number {
  return Math.ceil(state.remainingMs / 1000);
}

export function formatLockoutCountdown(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m <= 0) return `${r}s`;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
