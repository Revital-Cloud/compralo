/**
 * Evita mostrar en UI trazas SQL, psycopg2, SQLAlchemy, etc. que el backend
 * pueda incluir en `detail` de errores 500.
 */
const INTERNAL_MARKERS = [
  "psycopg",
  "sqlalchemy",
  "pl/pg",
  "[sql:",
  "numericvalueoutofrange",
  "(background on this error",
  "insert into tab_",
  'sql statement"',
] as const;

function shouldRedactApiErrorText(text: string): boolean {
  const t = text.trim();
  if (t.length > 320) return true;
  const lower = t.toLowerCase();
  return INTERNAL_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

/**
 * Normaliza `detail` de FastAPI y devuelve un texto seguro para toasts / UI.
 * Si el contenido parece error interno o es demasiado largo, devuelve `fallback`.
 */
export function toUserSafeApiDetail(detail: unknown, fallback: string): string {
  let raw = "";
  if (typeof detail === "string") raw = detail.trim();
  else if (Array.isArray(detail))
    raw = detail
      .map((e: { msg?: string }) => (typeof e?.msg === "string" ? e.msg : String(e)))
      .join(", ")
      .trim();
  else if (detail != null) raw = String(detail).trim();

  if (!raw) return fallback;
  if (shouldRedactApiErrorText(raw)) return fallback;
  return raw;
}
