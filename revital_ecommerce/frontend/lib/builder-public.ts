import { getApiBaseURL } from "@/utils/apiWrapper";
import type { BuilderPagePublic } from "@/services/builder.service";

/**
 * Lee la versión publicada de una página del CMS Builder desde el backend para
 * renderizar el storefront en el servidor (SSR/SEO). Si el backend no responde o
 * la página no está publicada, devuelve null y el caller hace fallback al
 * contenido estático: así nunca se rompe el render aunque el CMS esté vacío.
 */
export async function getPublishedPage(slug: string): Promise<BuilderPagePublic | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const base = getApiBaseURL();
    const res = await fetch(`${base}/builder/public/${slug}`, {
      // Refresca como máximo cada 30s; los cambios publicados se ven casi al instante.
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as BuilderPagePublic | null;
    if (!data || !Array.isArray(data.sections) || data.sections.length === 0) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
