"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ProductGallery, ProductInfo, RelatedProducts } from "@/components/product"
import CartToast from "@/components/ui/cart-toast"
import { useProductByIds } from "@/hooks/use-products"
import Loading from "@/components/ui/loading"

const ProductPage = () => {
  const params = useParams()
  const slug = params?.id as string
  
  const [showCartToast, setShowCartToast] = useState(false)
  const [cartData, setCartData] = useState<{
    color?: string
    size?: string
  }>({})

  // Obtener datos del producto usando el hook
  const { 
    data: product, 
    isLoading, 
    error 
  } = useProductByIds(slug, !!slug)

  const handleAddToCart = (selectedColor?: string, selectedSize?: string) => {
    if (!product) return
    
    // Guardar datos del carrito
    setCartData({
      color: selectedColor,
      size: selectedSize
    })
    
    // Mostrar toast inmediatamente
    setShowCartToast(true)
  }

  const handleAddToWishlist = () => {
    if (!product) return
    // Aquí iría la lógica para agregar a favoritos
    console.log("Agregado a lista de deseos:", product.nom_producto)
  }

  const handleViewCart = () => {
    // Navegar al carrito
    console.log("Navegar al carrito")
    setShowCartToast(false)
  }

  // Mostrar loading mientras se cargan los datos
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loading 
          size="xl" 
          variant="spinner" 
          text="Cargando producto..." 
          fullScreen={true}
        />
      </div>
    )
  }

  // Mostrar error si algo falló
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Error al cargar el producto
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error?.message || 'No se pudo cargar la información del producto'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Preparar datos para los componentes
  const productImages = product.img_producto ? [product.img_producto] : []
  const productPrice = parseFloat(product.val_precio.toString()) || 0
  
  // Extraer colores y tallas de las especificaciones si existen
  const colors = product.spcf_producto?.colors || 
                (product.spcf_producto?.color ? [{ name: 'Color', value: product.spcf_producto.color, available: true }] : [])
  const sizes = product.spcf_producto?.sizes || 
                (product.spcf_producto?.talla ? [{ name: product.spcf_producto.talla, available: true }] : [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 mb-8 md:mb-16">
          {/* Product Gallery */}
          <div className="w-full">
            <ProductGallery
              images={productImages}
              productName={product.nom_producto}
            />
          </div>

          {/* Product Information */}
          <div className="w-full mt-4 lg:mt-0">
            <ProductInfo
              product={product}
              name={product.nom_producto}
              price={productPrice}
              originalPrice={productPrice} // No hay precio original en el backend
              rating={4.5} // Rating hardcodeado por ahora
              reviewCount={12} // Review count hardcodeado por ahora
              colors={colors}
              sizes={sizes}
              isNew={false} // Por defecto no es nuevo
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
            />
          </div>
        </div>

        {/* Product Details Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 md:pt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información de Stock
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Stock disponible:</span>
                  <span className={`font-medium ${product.num_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.num_stock > 0 ? `${product.num_stock} unidades` : 'Sin stock'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className={`font-medium ${(product as any).ind_activo ? 'text-green-600' : 'text-red-600'}`}>
                    {(product as any).ind_activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Especificaciones
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {product.spcf_producto && typeof product.spcf_producto === 'object' ? (
                  Object.entries(product.spcf_producto).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))
                ) : (
                  <p>Sin especificaciones disponibles</p>
                )}
              </div>
            </div>

            {/* Product Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Información del Producto
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>ID:</span>
                  <span className="font-mono text-xs">{product.id_producto}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categoría:</span>
                  <span>{product.id_categoria}</span>
                </div>
                <div className="flex justify-between">
                  <span>Línea:</span>
                  <span>{product.id_linea}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sub-línea:</span>
                  <span>{product.id_sublinea}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marca:</span>
                  <span>{product.id_marca}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proveedor:</span>
                  <span>{product.id_proveedor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 md:pt-16">
          <RelatedProducts
            title="También te puede gustar"
            products={[]} // Por ahora sin productos relacionados
          />
        </div>
      </div>

      {/* Cart Toast */}
      <CartToast
        isVisible={showCartToast}
        productName={product.nom_producto}
        productImage={productImages[0] ?? ''}
        price={productPrice as number}
        selectedColor={cartData.color}
        selectedSize={cartData.size}
        onClose={() => setShowCartToast(false)}
        onViewCart={handleViewCart}
      />
    </div>
  )
}

export default ProductPage