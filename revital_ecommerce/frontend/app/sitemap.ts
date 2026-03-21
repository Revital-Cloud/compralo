import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/utils/url-helpers";

import type { Product } from "@/types/product";

const siteOrigin = getPublicSiteOrigin();

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Cache del sitemap para evitar recargar la API en cada solicitud del bot.
export const revalidate = 3600;

async function fetchJson<T>(url: string, timeoutMs = 3000): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

function toSitemapLastModified(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [
    { url: siteOrigin, priority: 1 },
    { url: `${siteOrigin}/products`, priority: 0.9 },
  ];

  // Para no romper el build si la API no está disponible (o está lenta),
  // hacemos un fallback a páginas base.
  try {
    const baseUrl = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;

    // El backend puede devolver:
    // - `Product[]`
    // - o `PaginatedResponse<Product>` con `{ items, pages }`
    const initialUrl = new URL("products", baseUrl);
    const data = await fetchJson<unknown>(initialUrl.toString());

    const appendProducts = (products: Product[]) => {
      for (const p of products) {
        const slugOrId = (p.slug ?? p.id)?.toString().trim();
        if (!slugOrId) continue;
        items.push({
          url: `${siteOrigin}/products/${encodeURIComponent(slugOrId)}`,
          lastModified: toSitemapLastModified(p.fec_update ?? p.fec_insert),
          priority: 0.7,
        });
      }
    };

    if (Array.isArray(data)) {
      appendProducts(data as Product[]);
      return items;
    }

    const maybeItems = (data as any)?.items;
    if (Array.isArray(maybeItems)) {
      appendProducts(maybeItems as Product[]);

      const pages = typeof (data as any)?.pages === "number" ? (data as any).pages : undefined;
      if (pages && pages > 1) {
        const limit = 500;
        for (let page = 2; page <= pages; page += 1) {
          const url = new URL("products", baseUrl);
          url.searchParams.set("limit", String(limit));
          url.searchParams.set("page", String(page));

          const pageData = await fetchJson<unknown>(url.toString());
          const pageItems = (pageData as any)?.items;
          if (Array.isArray(pageItems)) appendProducts(pageItems as Product[]);
        }
      }
    }
  } catch {
    // Fallback silencioso: mantenemos solo home + /products.
  }

  return items;
}

