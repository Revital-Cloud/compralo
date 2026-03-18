import type { Metadata } from "next";
import { getPublicSiteOrigin } from "@/utils/url-helpers";

const siteOrigin = getPublicSiteOrigin();
const siteName = "Compralo";

export function buildCanonical(pathname: string): string {
  try {
    return new URL(pathname, siteOrigin).toString();
  } catch {
    return `${siteOrigin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  }
}

export function buildBaseMetadata(): Metadata {
  return {
    metadataBase: new URL(siteOrigin),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
  };
}

export function buildOpenGraph(params: {
  title: string;
  description: string;
  pathname?: string;
  imageUrl?: string;
}): NonNullable<Metadata["openGraph"]> {
  const url = params.pathname ? buildCanonical(params.pathname) : siteOrigin;

  return {
    title: params.title,
    description: params.description,
    type: "website",
    url,
    siteName,
    locale: "es_ES",
    images: [
      {
        url: params.imageUrl ?? "/api/og",
        width: 1200,
        height: 630,
        alt: params.title,
      },
    ],
  };
}

export function buildTwitter(params: {
  title: string;
  description: string;
  imageUrl?: string;
}): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title: params.title,
    description: params.description,
    images: params.imageUrl ? [params.imageUrl] : undefined,
  };
}

