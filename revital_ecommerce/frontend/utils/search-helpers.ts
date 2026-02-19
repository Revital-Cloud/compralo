/**
 * Normaliza un texto para búsqueda: minúsculas y sin tildes/acentos.
 * Así "José" coincide con "jose", "México" con "mexico", etc.
 */
export function normalizeForSearch(str: string | null | undefined): string {
  if (str == null || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/**
 * Devuelve true si el texto `text` contiene la búsqueda `query`
 * (ambos normalizados: sin importar tildes ni mayúsculas).
 */
export function searchMatches(query: string, text: string | null | undefined): boolean {
  if (!query.trim()) return true;
  const nq = normalizeForSearch(query);
  const nt = normalizeForSearch(text);
  return nt.includes(nq);
}
