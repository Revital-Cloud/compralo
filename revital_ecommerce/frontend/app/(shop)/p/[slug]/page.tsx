import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuilderStorefrontRenderer } from "@/components/builder/storefront/page-renderer";
import { getPublishedPage } from "@/lib/builder-public";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: "Página no encontrada" };

  const title = page.seo?.title?.trim() || page.title;
  const description = page.seo?.description?.trim() || page.title;
  const imageUrl = page.seo?.og_image?.trim() || undefined;

  return {
    title,
    description,
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

  return (
    <div className="relative">
      <BuilderStorefrontRenderer sections={page.sections} />
    </div>
  );
}
