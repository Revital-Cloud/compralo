import EcommerceHeroCarousel from "@/components/layout/shop/hero/hero";
import { NewDropsSection } from "@/components/layout/shop/new-drops";
import { CategoriesSection } from "@/components/layout/shop/categories";
import { shouldShowSection } from "@/lib/config";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section - Always visible */}
      <EcommerceHeroCarousel />
      
      {/* New Drops Section - Configurable */}
      {shouldShowSection('showNewDrops') && <NewDropsSection />}
      
      {/* Categories Section - Configurable */}
      {shouldShowSection('showCategories') && <CategoriesSection />}
    </div>
  );
}
