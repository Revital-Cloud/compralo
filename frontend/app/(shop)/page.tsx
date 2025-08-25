import EcommerceHeroCarousel from "@/components/layout/shop/hero/hero";
import FeaturedCategories from "@/components/layout/shop/featured-categories/featured-categories";
import FeaturedProducts from "@/components/layout/shop/featured-products/featured-products";
import TestimonialsSection from "@/components/layout/shop/testimonials/testimonials";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { NoSSR } from "@/components/ui/no-ssr";

export default function Home() {
  return (
    <div className="relative">   
      {/* Hero Section - Compralo Design */}
      <EcommerceHeroCarousel />
      
      {/* Featured Categories Section */}
      <FeaturedCategories />
      
      {/* Featured Products Section */}
      <FeaturedProducts />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      <NoSSR>
        <CookieBanner />
      </NoSSR>
    </div>
  );
}
