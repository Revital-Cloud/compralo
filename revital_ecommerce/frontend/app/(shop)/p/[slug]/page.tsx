import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuilderStorefrontRenderer } from "@/components/builder/storefront/page-renderer";
import { getPublishedPage } from "@/lib/builder-public";
import { buildCanonical, buildOpenGraph, buildTwitter, safeJsonLd } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: "Página no encontrada", robots: { index: false } };

  const title = page.seo?.title?.trim() || page.title;
  const description = page.seo?.description?.trim() || page.title;
  const imageUrl = page.seo?.og_image?.trim() || undefined;

  return {
    title,
    description,
    alternates: { canonical: buildCanonical(`/p/${slug}`) },
    openGraph: buildOpenGraph({ title, description, pathname: `/p/${slug}`, imageUrl }),
    twitter: buildTwitter({ title, description, imageUrl }),
  };
};

export default async function BuilderPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);

  if (!page) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.seo?.title?.trim() || page.title,
    description: page.seo?.description?.trim() || page.title,
    url: buildCanonical(`/p/${slug}`),
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <BuilderStorefrontRenderer sections={page.sections} />
    </div>
  );
}
