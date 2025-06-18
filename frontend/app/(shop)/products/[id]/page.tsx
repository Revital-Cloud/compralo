"use client"

import { useState } from "react"
import { ProductGallery, ProductInfo, RelatedProducts } from "@/components/product"
import CartToast from "@/components/ui/cart-toast"
import { mockProductDetails, mockRelatedProducts } from "@/mockData/product-details"

const ProductPage = () => {
  const [showCartToast, setShowCartToast] = useState(false)
  const [cartData, setCartData] = useState<{
    color?: string
    size?: string
  }>({})

  const handleAddToCart = (selectedColor?: string, selectedSize?: string) => {
    // Encontrar el nombre del color seleccionado
    const colorName = selectedColor 
      ? mockProductDetails.colors.find(c => c.value === selectedColor)?.name 
      : undefined
    
    // Guardar datos del carrito
    setCartData({
      color: colorName,
      size: selectedSize
    })
    
    // Mostrar toast inmediatamente
    setShowCartToast(true)
  }

  const handleAddToWishlist = () => {
    // Aquí iría la lógica para agregar a favoritos
    console.log("Agregado a lista de deseos")
  }

  const handleViewCart = () => {
    // Navegar al carrito
    console.log("Navegar al carrito")
    setShowCartToast(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Product Gallery */}
          <div className="space-y-4">
            <ProductGallery
              images={mockProductDetails.images}
              productName={mockProductDetails.name}
            />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <ProductInfo
              name={mockProductDetails.name}
              price={mockProductDetails.price}
              originalPrice={mockProductDetails.originalPrice}
              rating={mockProductDetails.rating}
              reviewCount={mockProductDetails.reviewCount}
              colors={mockProductDetails.colors}
              sizes={mockProductDetails.sizes}
              isNew={mockProductDetails.isNew}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
            />
          </div>
        </div>

        {/* Related Products Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-16">
          <RelatedProducts
            title="También te puede gustar"
            products={mockRelatedProducts}
          />
        </div>
      </div>

      {/* Cart Toast */}
      <CartToast
        isVisible={showCartToast}
        productName={mockProductDetails.name}
        productImage={mockProductDetails.images[0]}
        price={mockProductDetails.price}
        selectedColor={cartData.color}
        selectedSize={cartData.size}
        onClose={() => setShowCartToast(false)}
        onViewCart={handleViewCart}
      />
    </div>
  )
}

export default ProductPage