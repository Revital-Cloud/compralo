import type { BuilderPagePublic } from "@/services/builder.service";

// En server components usamos NEXT_PUBLIC_API_URL directamente (misma convención que
// products/[id]/layout.tsx, sitemap.ts y los route handlers).
const SERVER_API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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
    const res = await fetch(`${SERVER_API_BASE}/builder/public/${slug}`, {
      // Sin caché: al publicar desde el builder, el cambio se ve en el acto.
      cache: "no-store",
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
