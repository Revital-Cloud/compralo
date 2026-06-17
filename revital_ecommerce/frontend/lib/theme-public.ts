import type { SiteTheme } from "@/lib/theme-types";

// En server components usamos NEXT_PUBLIC_API_URL directamente (misma convención que
// products/[id]/layout.tsx, sitemap.ts y los route handlers). getApiBaseURL() no sirve
// aquí: su rama dev-SSR usa DEV_INTERNAL_API_ORIGIN (no configurado, default :8001).
const SERVER_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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
    const res = await fetch(`${SERVER_API_BASE}/builder/theme/public`, {
      // Sin caché: al publicar el theme, el cambio se ve en el acto.
      cache: "no-store",
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
