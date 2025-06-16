import EcommerceHeroCarousel from "@/components/layout/shop/hero/hero";
import { NewDropsSection } from "@/components/layout/shop/new-drops";
import { CategoriesSection } from "@/components/layout/shop/categories";
import ThemeToggle from "@/components/layout/shop/theme-toggle";
import { shouldShowSection } from "@/lib/config";

export default function Home() {
  return (
    <div className="relative">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section - Always visible */}
      <EcommerceHeroCarousel />
      
      {/* New Drops Section - Configurable */}
      {shouldShowSection('showNewDrops') && <NewDropsSection />}
      
      {/* Categories Section - Configurable */}
      {shouldShowSection('showCategories') && <CategoriesSection />}
    </div>
  );
}
