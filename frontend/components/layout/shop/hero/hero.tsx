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

  const handleThumbnailSelect = (index: number) => {
    setSelectedThumbnail(index)
    setIsAutoPlaying(false)
    
    setTimeout(() => setIsAutoPlaying(true), 3000)
  }

  const currentProduct = customProducts[currentSlide]
  const currentImage = currentProduct.images[selectedThumbnail] || currentProduct.mainImage

  return (
    <section className={`relative w-full min-h-screen overflow-hidden ${className}`}>
      {/* Main Carousel */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentProduct.backgroundColor} transition-all duration-1000 ease-in-out`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="relative h-full flex items-center min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
            {/* Mobile Layout */}
            <div className={`lg:hidden flex flex-col items-center justify-center text-center h-full pt-24 pb-32 ${currentProduct.textColor}`}>
              <div className="w-full flex flex-col items-center justify-center">
                <div className="relative w-full max-w-sm">
                  {/* Product Badge */}
                  <ProductBadge badge={currentProduct.badge} />

                  {/* Product Info */}
                  <ProductInfo 
                    name={currentProduct.name}
                    subtitle={currentProduct.subtitle}
                    isMobile={true}
                  />

                  {/* Pricing */}
                  <ProductPricing 
                    price={currentProduct.price}
                    originalPrice={currentProduct.originalPrice}
                    isMobile={true}
                  />

                  {/* Actions */}
                  <ProductActions 
                    onShopNow={() => onShopNow?.(currentProduct)}
                    onAddToWishlist={() => onAddToWishlist?.(currentProduct)}
                    isMobile={true}
                  />

                  {/* Features */}
                  <ProductFeatures 
                    isMobile={true}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className={`hidden lg:grid grid-cols-2 gap-8 items-center h-full ${currentProduct.textColor}`}>
              {/* Left Column: Product Info */}
              <div className="flex flex-col justify-center items-start text-left">
                <div className="max-w-md w-full">
                  {/* Product Badge */}
                  <ProductBadge badge={currentProduct.badge} />

                  {/* Product Info */}
                  <ProductInfo 
                    name={currentProduct.name}
                    subtitle={currentProduct.subtitle}
                  />

                  {/* Pricing */}
                  <ProductPricing 
                    price={currentProduct.price}
                    originalPrice={currentProduct.originalPrice}
                  />

                  {/* Actions */}
                  <ProductActions 
                    onShopNow={() => onShopNow?.(currentProduct)}
                    onAddToWishlist={() => onAddToWishlist?.(currentProduct)}
                  />

                  {/* Features */}
                  <ProductFeatures />
                </div>
              </div>

              {/* Right Column: Product Image & Thumbnails */}
              <div className="relative flex flex-col items-center space-y-6 xl:space-y-8">
                {/* Main Product Image */}
                <ProductImage 
                  src={currentImage}
                  alt={`${currentProduct.name} - Vista ${selectedThumbnail + 1}`}
                />

                {/* Product Thumbnails */}
                <ProductThumbnails 
                  thumbnails={currentProduct.thumbnails}
                  productName={currentProduct.name}
                  selectedThumbnail={selectedThumbnail}
                  onThumbnailSelect={handleThumbnailSelect}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Hidden on mobile */}
        <div className="hidden md:block">
          <NavigationButtons 
            onPrev={prevSlide}
            onNext={nextSlide}
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          />
        </div>

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
