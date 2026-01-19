"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui"

interface ProductActionsProps {
  onShopNow?: () => void
  onAddToWishlist?: () => void
  shopButtonText?: string
  wishlistButtonText?: string
  isMobile?: boolean
}

const ProductActions: React.FC<ProductActionsProps> = ({
  onShopNow,
  onAddToWishlist,
  shopButtonText = "SHOP NOW",
  wishlistButtonText = "Add to Wishlist",
  isMobile = false
}) => (
  <div className={`flex gap-3 sm:gap-4 pt-2 sm:pt-4 w-full ${
    isMobile 
      ? 'flex-col items-center max-w-xs mx-auto' 
      : 'flex-col sm:flex-row'
  }`}>
    <Button
      size={isMobile ? "default" : "lg"}
      onClick={onShopNow}
      className={`bg-white text-black hover:bg-gray-200 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
        isMobile 
          ? 'w-full px-6 py-3 text-base' 
          : 'px-8 py-4 text-lg'
      }`}
    >
      {shopButtonText}
    </Button>
    <Button
      variant="outline"
      size={isMobile ? "default" : "lg"}
      onClick={onAddToWishlist}
      className={`bg-transparent border-2 border-white/50 text-white hover:bg-white/10 font-semibold rounded-xl backdrop-blur-sm transition-all duration-300 ${
        isMobile 
          ? 'w-full px-6 py-3 text-base' 
          : 'px-8 py-4 text-lg'
      }`}
    >
      <Heart className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
      {wishlistButtonText}
    </Button>
  </div>
)

export default ProductActions 