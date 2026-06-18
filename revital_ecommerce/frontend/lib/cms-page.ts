import type { Metadata } from "next";

import { getPublishedPage } from "@/lib/builder-public";
import { buildCanonical, buildOpenGraph, buildTwitter } from "@/lib/seo";

/**
 * Metadata para una ruta gestionada por el CMS (URL fija, ej. /nosotros) que
 * puede tener una página publicada en el builder con su mismo slug. Si hay
 * página publicada, usa su SEO; si no, cae a los valores estáticos de la ruta.
 */
export async function managedPageMetadata(
  slug: string,
  fallback: { title: string; description: string; pathname: string },
): Promise<Metadata> {
  const page = await getPublishedPage(slug);
  const title = page?.seo?.title?.trim() || fallback.title;
  const description = page?.seo?.description?.trim() || fallback.description;
  const imageUrl = page?.seo?.og_image?.trim() || undefined;

  return {
    title,
    description,
    alternates: { canonical: buildCanonical(fallback.pathname) },
    openGraph: buildOpenGraph({ title, description, pathname: fallback.pathname, imageUrl }),
    twitter: buildTwitter({ title, description, imageUrl }),
  };
}
