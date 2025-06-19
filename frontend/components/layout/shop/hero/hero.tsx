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

        <div className="relative h-full flex items-center min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile/Tablet Layout (below lg) */}
            <div className="lg:hidden flex flex-col items-center justify-center space-y-6 sm:space-y-8 py-8 sm:py-12">
              {/* Product Image - Mobile First */}
              <div className="relative flex flex-col items-center space-y-4 sm:space-y-6 order-1">
                <ProductImage 
                  src={currentImage}
                  alt={`${currentProduct.name} - Vista ${selectedThumbnail + 1}`}
                  className="w-64 h-64 sm:w-80 sm:h-80"
                />
                
                {/* Product Thumbnails - Mobile */}
                <ProductThumbnails 
                  thumbnails={currentProduct.thumbnails}
                  productName={currentProduct.name}
                  selectedThumbnail={selectedThumbnail}
                  onThumbnailSelect={handleThumbnailSelect}
                  className="justify-center"
                />
              </div>

              {/* Product Content - Mobile */}
              <div className={`flex flex-col items-center text-center space-y-4 sm:space-y-6 ${currentProduct.textColor} z-10 order-2 w-full max-w-md sm:max-w-lg`}>
                {/* Badge */}
                <ProductBadge badge={currentProduct.badge} />

                {/* Product Info */}
                <ProductInfo 
                  name={currentProduct.name}
                  subtitle={currentProduct.subtitle}
                  textColor={currentProduct.textColor}
                  isMobile={true}
                />

                {/* Pricing */}
                <ProductPricing 
                  price={currentProduct.price}
                  originalPrice={currentProduct.originalPrice}
                  textColor={currentProduct.textColor}
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
                  textColor={currentProduct.textColor}
                  isMobile={true}
                />
              </div>
            </div>

            {/* Desktop Layout (lg and up) */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-8 xl:gap-12 items-center h-full min-h-screen">
              {/* Product Content - Desktop */}
              <div className={`flex flex-col space-y-6 xl:space-y-8 ${currentProduct.textColor} z-10`}>
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

              {/* Product Image & Thumbnails - Desktop */}
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
