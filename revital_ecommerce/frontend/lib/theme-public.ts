import { getApiBaseURL } from "@/utils/apiWrapper";
import type { SiteTheme } from "@/lib/theme-types";

/**
 * Lee el theme global publicado desde el backend para renderizar el storefront
 * en el servidor. Si el backend no responde o no hay theme publicado, devuelve
 * null y el caller usa el theme por defecto (DEFAULT_THEME): así el sitio nunca
 * se rompe ni queda sin estilos.
 */
export async function getPublishedTheme(): Promise<SiteTheme | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const base = getApiBaseURL();
    const res = await fetch(`${base}/builder/theme/public`, {
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SiteTheme | null;
    if (!data || !data.theme || !data.theme.colors) return null;
    return data;
  } catch {
    // Backend caído, timeout o sin theme publicado: el caller usa DEFAULT_THEME.
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
