import type { Metadata } from "next";
import { getPublicSiteOrigin } from "@/utils/url-helpers";
import { buildCanonical, buildOpenGraph, buildTwitter } from "@/lib/seo";

const siteOrigin = getPublicSiteOrigin();
const title = "Productos";
const description =
  "Compra productos de múltiples categorías con envíos rápidos y seguros. Encuentra lo que necesitas y haz tu pedido en minutos.";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title,
  description,
  alternates: {
    canonical: buildCanonical("/products"),
  },
  openGraph: buildOpenGraph({
    title,
    description,
    pathname: "/products",
  }),
  twitter: buildTwitter({
    title,
    description,
  }),
};

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

