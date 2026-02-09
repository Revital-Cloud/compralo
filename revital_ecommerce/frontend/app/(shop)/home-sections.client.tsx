"use client"

import dynamic from "next/dynamic"

const FeaturedCategories = dynamic(
  () => import("@/components/layout/shop/featured-categories/featured-categories"),
  {
    ssr: false,
    loading: () => <div className="min-h-[480px]" aria-hidden="true" />,
  }
)

const TestimonialsSection = dynamic(
  () => import("@/components/layout/shop/testimonials/testimonials"),
  {
    ssr: false,
    loading: () => <div className="min-h-[360px]" aria-hidden="true" />,
  }
)

export function FeaturedCategoriesClient() {
  return <FeaturedCategories />
}

export function TestimonialsSectionClient() {
  return <TestimonialsSection />
}
