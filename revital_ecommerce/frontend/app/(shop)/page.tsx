import type { Metadata } from "next";
import { NoSSR, CookieBanner } from "@/components/ui";
import { InformativeChatbotWidget } from "@/components/chatbot-widget/informative-chatbot-widget";
import { BuilderStorefrontRenderer } from "@/components/builder/storefront/page-renderer";
import { getPublishedPage } from "@/lib/builder-public";
import { DEFAULT_HOME_SECTIONS } from "@/lib/default-home-sections";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

const DEFAULT_TITLE = "Tienda online de productos seleccionados";
const DEFAULT_DESCRIPTION =
  "Explora Compralo: descubre productos destacados, categorías populares y ofertas especiales en una sola tienda online.";

export const generateMetadata = async (): Promise<Metadata> => {
  const page = await getPublishedPage("home");
  const title = page?.seo?.title?.trim() || DEFAULT_TITLE;
  const description = page?.seo?.description?.trim() || DEFAULT_DESCRIPTION;

  const imageUrl = page?.seo?.og_image?.trim() || undefined;

  return {
    title,
    description,
    openGraph: buildOpenGraph({ title, description, pathname: "/", imageUrl }),
    twitter: buildTwitter({ title, description, imageUrl }),
  };
};

export default async function Home() {
  // La home se renderiza siempre desde el pipeline del CMS Builder: la versión
  // publicada en DB, o el layout por defecto si aún no se ha publicado nada. El
  // layout por defecto produce las mismas secciones que la home original.
  const page = await getPublishedPage("home");
  const sections = page?.sections?.length ? page.sections : DEFAULT_HOME_SECTIONS;

  return (
    <div className="relative">
      <BuilderStorefrontRenderer sections={sections} />

      <NoSSR>
        <CookieBanner />
      </NoSSR>

      {/* Solo en Home - Bot Asistente */}
      <NoSSR>
        <InformativeChatbotWidget />
      </NoSSR>
    </div>
  );
}
