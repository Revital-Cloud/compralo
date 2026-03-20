import type { Metadata } from "next";

import { getPublicSiteOrigin } from "@/utils/url-helpers";
import { buildCanonical, buildOpenGraph, buildTwitter } from "@/lib/seo";
import type { Product } from "@/types/product";

const siteOrigin = getPublicSiteOrigin();

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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

export async function generateMetadata({
  params,
}: {
  // Next.js puede pasar `params` como Promise en App Router.
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const fallbackTitle = "Producto";
  const fallbackDescription =
    "Compra el producto que buscas con envíos rápidos y seguros.";

  // Evitamos que un fallo de red rompa el build/render.
  try {
    const url = new URL(
      `products/${encodeURIComponent(id)}`,
      apiBase.endsWith("/") ? apiBase : `${apiBase}/`
    );
    const product = await fetchJson<Product>(url.toString());

    const slugOrId = (product.slug ?? product.id ?? id)
      ?.toString()
      .trim();
    const title = product.name ? `${product.name}` : fallbackTitle;
    const description =
      product.description?.trim() ||
      (product.name
        ? `Compra ${product.name} con envíos rápidos y seguros.`
        : fallbackDescription);

    const canonicalPath = `/products/${slugOrId || id}`;

    return {
      metadataBase: new URL(siteOrigin),
      title,
      description,
      alternates: {
        canonical: buildCanonical(canonicalPath),
      },
      openGraph: buildOpenGraph({
        title,
        description,
        pathname: canonicalPath,
      }),
      twitter: buildTwitter({
        title,
        description,
      }),
    };
  } catch {
    // Si no hay producto, dejamos metadatos genéricos.
    // Si en vuestro flujo prefieren 404 real, se puede cambiar a `notFound()`.
    // Mantenerlo genérico reduce riesgo de romper rutas.
    return {
      metadataBase: new URL(siteOrigin),
      title: fallbackTitle,
      description: fallbackDescription,
      alternates: {
        canonical: buildCanonical(`/products/${id}`),
      },
      openGraph: buildOpenGraph({
        title: fallbackTitle,
        description: fallbackDescription,
        pathname: `/products/${id}`,
      }),
      twitter: buildTwitter({
        title: fallbackTitle,
        description: fallbackDescription,
      }),
    };
  }
}

export default function ProductDetailLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

