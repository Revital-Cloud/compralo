import EcommerceHeroCarousel from "@/components/layout/shop/hero/hero";
import FeaturedProducts from "@/components/layout/shop/featured-products/featured-products";
import { FeaturedCategoriesClient, TestimonialsSectionClient } from "./home-sections.client";
import { NoSSR, CookieBanner } from "@/components/ui";
import { InformativeChatbotWidget } from "@/components/chatbot-widget/informative-chatbot-widget";

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
