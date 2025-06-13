"use client"

import { useState, useEffect } from "react"
import {
  ProductBadge,
  ProductInfo,
  ProductPricing,
  ProductActions,
  ProductFeatures,
  ProductImage,
  ProductThumbnails,
  NavigationButtons,
  SlideIndicators,
  ProductCounter
} from "./components"
import { products } from "@/lib/hero-products"


interface HeroCarouselProps {
  products?: typeof products
  autoPlayInterval?: number
  onShopNow?: (product: typeof products[0]) => void
  onAddToWishlist?: (product: typeof products[0]) => void
  className?: string
}

const EcommerceHeroCarousel: React.FC<HeroCarouselProps> = ({
  products: customProducts = products,
  autoPlayInterval = 6000,
  onShopNow,
  onAddToWishlist,
  className = ""
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % customProducts.length)
      setSelectedThumbnail(0)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, autoPlayInterval, customProducts.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % customProducts.length)
    setSelectedThumbnail(0)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + customProducts.length) % customProducts.length)
    setSelectedThumbnail(0)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setSelectedThumbnail(0)
  }

  const currentProduct = customProducts[currentSlide]

  return (
    <section className={`relative w-full h-screen overflow-hidden ${className}`}>
      {/* Main Carousel */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentProduct.backgroundColor} dark:from-gray-800 dark:via-gray-900 dark:to-black transition-all duration-1000 ease-in-out`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center h-full">
              {/* Product Content */}
              <div className={`flex flex-col space-y-6 ${currentProduct.textColor} z-10`}>
                {/* Badge */}
                <ProductBadge badge={currentProduct.badge} />

                {/* Product Info */}
                <ProductInfo 
                  name={currentProduct.name}
                  subtitle={currentProduct.subtitle}
                  textColor={currentProduct.textColor}
                />

                {/* Pricing */}
                <ProductPricing 
                  price={currentProduct.price}
                  originalPrice={currentProduct.originalPrice}
                  textColor={currentProduct.textColor}
                />

                {/* Actions */}
                <ProductActions 
                  onShopNow={() => onShopNow?.(currentProduct)}
                  onAddToWishlist={() => onAddToWishlist?.(currentProduct)}
                />

                {/* Features */}
                <ProductFeatures textColor={currentProduct.textColor} />
              </div>

              {/* Product Image & Thumbnails */}
              <div className="relative flex flex-col items-center space-y-6">
                {/* Main Product Image */}
                <ProductImage 
                  src={currentProduct.mainImage}
                  alt={currentProduct.name}
                />

                {/* Product Thumbnails */}
                <ProductThumbnails 
                  thumbnails={currentProduct.thumbnails}
                  productName={currentProduct.name}
                  selectedThumbnail={selectedThumbnail}
                  onThumbnailSelect={setSelectedThumbnail}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <NavigationButtons 
          onPrev={prevSlide}
          onNext={nextSlide}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        />

        {/* Slide Indicators */}
        <SlideIndicators 
          totalSlides={customProducts.length}
          currentSlide={currentSlide}
          onSlideChange={goToSlide}
        />

        {/* Product Counter */}
        <ProductCounter 
          currentSlide={currentSlide}
          totalSlides={customProducts.length}
        />
      </div>
    </section>
  )
}

export default EcommerceHeroCarousel
