"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductActionsProps {
  onShopNow?: () => void
  onAddToWishlist?: () => void
  shopButtonText?: string
  wishlistButtonText?: string
}

const ProductActions: React.FC<ProductActionsProps> = ({
  onShopNow,
  onAddToWishlist,
  shopButtonText = "SHOP NOW",
  wishlistButtonText = "Add to Wishlist"
}) => (
  <div className="flex flex-col sm:flex-row gap-4 pt-4">
    <Button
      size="lg"
      onClick={onShopNow}
      className="bg-white dark:bg-blue-600 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-blue-700 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {shopButtonText}
    </Button>
    <Button
      variant="outline"
      size="lg"
      onClick={onAddToWishlist}
      className="border-2 border-white/50 dark:border-gray-300/50 text-black dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-700/30 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm"
    >
      <Heart className="w-5 h-5 mr-2" />
      {wishlistButtonText}
    </Button>
  </div>
)

export default ProductActions 