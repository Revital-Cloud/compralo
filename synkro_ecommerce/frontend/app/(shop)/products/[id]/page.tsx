"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProductGallery, ProductInfo, RelatedProducts } from "@/components/product"
import { ReviewsSection } from "@/components/ui/reviews-section"
import { useProduct } from "@/hooks/use-products"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"

const ProductPage = () => {
  const params = useParams()
  const router = useRouter()
  const slug = params?.id as string
  
  const [showCartToast, setShowCartToast] = useState(false)
  const [cartData, setCartData] = useState<{
    color?: string
    size?: string
  }>({})
  const [isAttemptingAdd, setIsAttemptingAdd] = useState(false)

  // Obtener datos del producto usando el hook
  const { 
    data: product, 
    isLoading, 
    error 
  } = useProduct(slug)

  // Hook del carrito para funcionalidad real
  const { 
    addToCart, 
    isAddingToCart,
    error: cartError 
  } = useCart()

  // Manejar errores del carrito solo cuando estamos intentando agregar
  useEffect(() => {
    if (isAttemptingAdd && cartError) {
      toast.error(typeof cartError === 'string' ? cartError : 'Error al agregar producto')
      setIsAttemptingAdd(false)
    } else if (isAttemptingAdd && !isAddingToCart && !cartError) {
      // Éxito - mostrar confirmación
      setShowCartToast(true)
      setIsAttemptingAdd(false)
    }
  }, [cartError, isAddingToCart, isAttemptingAdd])

  const handleAddToCart = async (selectedColor?: string, selectedSize?: string) => {
    if (!product) {
      toast.error('No hay producto para agregar al carrito')
      return
    }
    
    // Validar stock disponible
    if (product.num_stock <= 0) {
      toast.error('Producto agotado')
      return
    }
    
    // Preparar datos del producto para el carrito
    const cartProductData = {
      id_categoria_producto: Number(product.id_categoria) || 1,
      id_linea_producto: Number(product.id_linea) || 1, 
      id_sublinea_producto: Number(product.id_sublinea) || 1,
      id_producto: Number(product.id_producto),
      cantidad: 1, // Por defecto agregamos 1 unidad
      precio_unitario_carrito: parseFloat(product.val_precio.toString()),
      stock_disponible: product.num_stock // Pasar stock para validación
    }

    // Guardar datos para el toast (en caso de éxito)
    setCartData({
      color: selectedColor,
      size: selectedSize
    })
    
    // Marcar que estamos intentando agregar
    setIsAttemptingAdd(true)
    
    // Llamar al hook del carrito
    addToCart(cartProductData)
  }


  const handleViewCart = () => {
    // Navegar al carrito real
    router.push('/cart')
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
  
  // Verificar que img_producto tenga la estructura correcta
  const hasValidImages = product.img_producto && 
    typeof product.img_producto === 'object' && 
    'main' in product.img_producto
  
  const productImages = hasValidImages ? [
    (product.img_producto as any).main,
    ...((product.img_producto as any).gallery || [])
  ].filter(Boolean) : []
  
  // Preparar miniaturas para la galería
  const productThumbnails = hasValidImages ? ((product.img_producto as any).thumbnails || []) : []
  
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
              product={product as any}
              name={product.nom_producto}
              price={productPrice}
              originalPrice={productPrice} // No hay precio original en el backend
              rating={4.5} // Rating hardcodeado por ahora
              reviewCount={12} // Review count hardcodeado por ahora
              colors={colors}
              sizes={sizes}
              isNew={false} // Por defecto no es nuevo
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>

        {/* Product Details Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-16 md:pt-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stock Information */}
            <div className="space-y-4 pb-8">
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
            <div className="space-y-4 pb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Especificaciones
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {product.spcf_producto && typeof product.spcf_producto === 'object' ? (
                  Object.entries(product.spcf_producto)
                    .filter(([key, value]) => {
                      // Filtrar valores que no tengan información útil
                      if (value === null || value === undefined) return false
                      if (typeof value === 'string' && value.trim() === '') return false
                      if (Array.isArray(value) && value.length === 0) return false
                      if (typeof value === 'object' && Object.keys(value).length === 0) return false
                      return true
                    })
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))
                ) : (
                  <p>Sin especificaciones disponibles</p>
                )}
              </div>
            </div>

            {/* Product Metadata */}
            <div className="space-y-4 pb-8">
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
                  <span>{product.nom_categoria || product.id_categoria}</span>
                </div>
                <div className="flex justify-between">
                  <span>Línea:</span>
                  <span>{product.nom_linea || product.id_linea}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sub-línea:</span>
                  <span>{product.nom_sublinea || product.id_sublinea}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marca:</span>
                  <span>{product.nom_marca || product.id_marca}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proveedor:</span>
                  <span>{product.nom_proveedor || product.id_proveedor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 md:pt-16">
          <ReviewsSection
            productId={`${product.id_categoria}-${product.id_linea}-${product.id_sublinea}-${product.id_producto}`}
            productName={product.nom_producto}
          />
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