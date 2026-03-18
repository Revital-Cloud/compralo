import type { Metadata } from "next";
import EcommerceHeroCarousel from "@/components/layout/shop/hero/hero";
import FeaturedProducts from "@/components/layout/shop/featured-products/featured-products";
import { FeaturedCategoriesClient, TestimonialsSectionClient } from "./home-sections.client";
import { NoSSR, CookieBanner } from "@/components/ui";
import { InformativeChatbotWidget } from "@/components/chatbot-widget/informative-chatbot-widget";
import { buildOpenGraph, buildTwitter } from "@/lib/seo";

export const generateMetadata = (): Metadata => {
  const title = "Tienda online de productos seleccionados";
  const description =
    "Explora Compralo: descubre productos destacados, categorías populares y ofertas especiales en una sola tienda online.";

  return {
    title,
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      pathname: "/",
    }),
    twitter: buildTwitter({
      title,
      description,
    }),
  };
};

export default function Home() {
  return (
    <div className="relative">   
      {/* Hero Section - Compralo Design */}
      <EcommerceHeroCarousel />
      
      {/* Featured Categories Section */}
      <FeaturedCategoriesClient />
      
      {/* Featured Products Section */}
      <FeaturedProducts />
      
      {/* Testimonials Section */}
      <TestimonialsSectionClient />
      
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
