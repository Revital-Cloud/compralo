"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ProductGallery, ProductInfo, ProductVariantSelector, RelatedProducts } from "@/components/product"
import type { ProductColorOption } from "@/components/product/product-info"
import { ReviewsSection } from "@/components/ui/reviews-section"
import Loading from "@/components/ui/loading"
import { CartToast } from "@/components/ui"
import { useProduct } from "@/hooks/use-products"
import { useVariantSelector } from "@/hooks/use-variant-selector"
import { useCart } from "@/hooks/use-cart"
import { getHexForColorName } from "@/utils/color-map"
import { toast } from "sonner"
import * as productService from "@/services/product.service"
import { getProductImageUrl } from "@/utils/image-helpers"
import { normalizeProductDetail, type ApiProductResponse } from "@/lib/product-detail-normalizer"

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
  const [selectedColor, setSelectedColor] = useState<string>("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  /** Atributos seleccionados por attribute_id para filtrado dependiente (ej. Color=Negro → solo 128GB habilitado) */
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})

  // Obtener datos del producto usando el hook
  const { 
    data: product, 
    isLoading, 
    error 
  } = useProduct(slug)

  const productDetail = useMemo(
    () => normalizeProductDetail(product as ApiProductResponse | undefined),
    [product]
  )
  const variantSelector = useVariantSelector(productDetail, slug)
  const useVariantSelectorFlow = (productDetail?.attributeDefinitions?.length ?? 0) > 0

  // Productos de la misma categoría para "También te puede gustar"
  const categoryId = product?.category_id != null ? Number(product.category_id) : undefined
  const { data: relatedResponse } = useQuery({
    queryKey: ["relatedProducts", categoryId, slug],
    queryFn: () =>
      productService.filterProducts({
        category_id: categoryId!,
        include_subcategories: true,
        limit: 9,
        offset: 0,
        ordenar_por: "nombre",
        orden: "ASC",
      }),
    enabled: categoryId != null && !!slug,
    staleTime: 5 * 60 * 1000,
  })
  const relatedProducts = useMemo(() => {
    if (!relatedResponse?.products || !slug) return []
    const currentSlug = slug
    return relatedResponse.products
      .filter((p) => (p.slug ?? String(p.id)) !== currentSlug)
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: typeof p.price_min === "number" ? p.price_min : parseFloat(String(p.price_min ?? 0)),
        image: getProductImageUrl(p.image_url),
        slug: p.slug ?? String(p.id),
      }))
  }, [relatedResponse, slug])

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

  // Extraer colores desde API (spcf_producto.colors con hex_color cuando exista)
  const colors: ProductColorOption[] = useMemo(() => {
    const raw = product?.variant_options ?? product?.spcf_producto
    if (!raw) return []
    if (Array.isArray(raw.colors) && raw.colors.length > 0) {
      return raw.colors.map((c: { name?: string; value?: string; available?: boolean; hex_color?: string }) => ({
        name: c.name ?? c.value ?? '',
        value: c.value ?? c.name ?? '',
        available: c.available !== false,
        displayHex: c.hex_color ?? getHexForColorName((c.value ?? c.name ?? '').trim())
      }))
    }
    const colorStr = (raw as Record<string, unknown>).color
    if (!colorStr || typeof colorStr !== 'string') return []
    return colorStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        value: name,
        available: true,
        displayHex: getHexForColorName(name)
      }))
  }, [product?.variant_options, product?.spcf_producto])

  // Al cambiar de producto (slug), resetear selección
  useEffect(() => {
    setSelectedImageIndex(0)
    setSelectedColor("")
    setSelectedVariantId(null)
    setSelectedAttributes({})
  }, [slug])

  // Variantes e imágenes por variante (siempre mismos hooks; product puede ser undefined)
  const variants = useMemo(() => (product as any)?.variants ?? [], [product])
  const imagesByVariant = useMemo(() => (product as any)?.images_by_variant ?? {}, [product])
  const attributesFromApi = useMemo(
    () => (product as { variant_options?: { attributes?: Array<{ attribute_id: number; attribute_name: string; values: Array<{ value: string; hex_color?: string | null; variant_ids: number[] }> }> } })?.variant_options?.attributes ?? [],
    [product]
  )

  // Variantes que coinciden con la selección actual de atributos (filtrado dependiente)
  const matchingVariantIds = useMemo(() => {
    if (attributesFromApi.length === 0) return new Set(variants.map((v: { id: number }) => v.id))
    let ids: Set<number> | null = null
    for (const attr of attributesFromApi) {
      const selectedVal = selectedAttributes[String(attr.attribute_id)]
      if (!selectedVal) continue
      const valueObj = attr.values.find((v) => (v.value ?? "").trim() === (selectedVal ?? "").trim())
      const variantIds = (valueObj?.variant_ids ?? []) as number[]
      const vids = new Set<number>(variantIds)
      if (ids === null) ids = vids
      else ids = new Set<number>([...ids].filter((id: number) => vids.has(id)))
    }
    return ids ?? new Set(variants.map((v: { id: number }) => v.id))
  }, [attributesFromApi, selectedAttributes, variants])

  // Por cada atributo, marcar qué valores están disponibles (existen en alguna variante que coincida con el resto de selección)
  const attributesWithAvailability = useMemo(() => {
    return attributesFromApi.map((attr) => ({
      ...attr,
      values: attr.values.map((v) => ({
        ...v,
        available: ((v.variant_ids ?? []) as number[]).some((id: number) => matchingVariantIds.has(id)),
      })),
    }))
  }, [attributesFromApi, matchingVariantIds])

  // Variante seleccionada (flujo legacy por attribute_id)
  const selectedVariant = useMemo(() => {
    const match = variants.find((v: { id: number }) => matchingVariantIds.has(v.id))
    if (match) return match as { id: number; price?: number; stock?: number; color?: string }
    return null
  }, [variants, matchingVariantIds])

  const effectiveSelectedVariantId = useVariantSelectorFlow
    ? (variantSelector.selectedVariant?.id ?? null)
    : selectedVariantId
  const effectiveSelectedVariant = useVariantSelectorFlow ? variantSelector.selectedVariant : selectedVariant

  // Preseleccionar primera variante/color o primeros atributos cuando cargan los datos (solo flujo legacy)
  useEffect(() => {
    if (useVariantSelectorFlow || !product) return
    if (attributesFromApi.length > 0) {
      const initial: Record<string, string> = {}
      for (const attr of attributesFromApi) {
        const firstVal = attr.values[0]?.value
        if (firstVal) initial[String(attr.attribute_id)] = firstVal
      }
      setSelectedAttributes((prev) => (Object.keys(prev).length === 0 ? initial : prev))
    } else if (colors.length > 0) {
      const firstColor = colors[0].value
      setSelectedColor(firstColor)
      const firstV = (product as any)?.variants?.find((v: { color?: string }) => (v.color ?? '').trim() === (firstColor ?? '').trim())
      setSelectedVariantId(firstV ? (firstV as { id: number }).id : null)
    } else if ((product as any)?.variants?.length) {
      setSelectedVariantId((product as any).variants[0].id)
    }
  }, [useVariantSelectorFlow, product?.id, colors.length, attributesFromApi.length])

  // Galería unificada: primero imágenes del producto, luego de cada variante (todas las miniaturas siempre visibles)
  const { allGalleryUrls, variantIdByIndex, firstImageIndexByVariantId } = useMemo(() => {
    const urls: string[] = []
    const variantAtIdx: (number | null)[] = []
    const firstByVariant: Record<string, number> = {}

    if (!product) return { allGalleryUrls: [], variantIdByIndex: [], firstImageIndexByVariantId: {} }

    // 1) Imágenes del producto (sin variante)
    const imagesArray = (product as { images?: Array<{ image_url?: string; is_main?: boolean; sort_order?: number }> }).images
    if (imagesArray?.length) {
      const sorted = [...imagesArray].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      for (const x of sorted) {
        if (x.image_url) {
          urls.push(x.image_url)
          variantAtIdx.push(null)
        }
      }
    } else {
      const img = (product as any).image_url ?? (product as any).img_producto
      if (img && typeof img === "object" && "main" in img) {
        const main = (img as { main?: string }).main
        const gallery = (img as { gallery?: string[] }).gallery || []
        if (main) urls.push(main)
        variantAtIdx.push(null)
        gallery.forEach((u: string) => {
          if (u) {
            urls.push(u)
            variantAtIdx.push(null)
          }
        })
      } else if (img && typeof img === "string") {
        urls.push(img)
        variantAtIdx.push(null)
      }
    }

    // 2) Imágenes por variante (orden estable: por id de variante)
    const variantList = (product as any)?.variants ?? []
    for (const v of variantList) {
      const vid = String(v.id)
      const list = imagesByVariant[vid]
      if (!list?.length) continue
      const ordered = [...list].sort((a, b) => a.sort_order - b.sort_order)
      const mainIdx = ordered.findIndex((x) => x.is_main)
      const orderedList = mainIdx >= 0 ? [ordered[mainIdx], ...ordered.filter((_, i) => i !== mainIdx)] : ordered
      const startIdx = urls.length
      firstByVariant[vid] = startIdx
      for (const x of orderedList) {
        if (x.image_url) {
          urls.push(x.image_url)
          variantAtIdx.push(v.id)
        }
      }
    }

    return {
      allGalleryUrls: urls,
      variantIdByIndex: variantAtIdx,
      firstImageIndexByVariantId: firstByVariant,
    }
  }, [product, imagesByVariant])

  // URLs resueltas para la galería
  const productImagesResolved = useMemo(
    () => allGalleryUrls.map((url) => getProductImageUrl(url)),
    [allGalleryUrls]
  )

  const productPrice = useMemo(() => {
    if (!product) return 0
    if (effectiveSelectedVariant?.price != null) return parseFloat(String(effectiveSelectedVariant.price))
    if (effectiveSelectedVariantId != null && variants.length) {
      const v = variants.find((x: { id: number }) => x.id === effectiveSelectedVariantId)
      if (v?.price != null) return parseFloat(String(v.price))
    }
    return parseFloat(String((product as any).price_min ?? product.val_precio)) || 0
  }, [product, effectiveSelectedVariant, effectiveSelectedVariantId, variants])

  const productStock = useMemo(() => {
    if (effectiveSelectedVariant?.stock != null) return Number(effectiveSelectedVariant.stock)
    if (!product) return 0
    return (product as { num_stock?: number; stock_total?: number }).num_stock ?? (product as { stock_total?: number }).stock_total ?? 0
  }, [product, effectiveSelectedVariant])

  // Nombre del atributo que es "color" (el que tiene hex_color en sus valores) para ligar la imagen solo al color
  const colorAttributeName = useMemo(
    () =>
      productDetail?.attributeDefinitions?.find((attr) =>
        attr.values.some((v) => v.hex_color != null && v.hex_color !== "")
      )?.name ?? null,
    [productDetail?.attributeDefinitions]
  )

  // Imagen ligada solo al color: si hay color seleccionado, primera variante con ese color; si no, null (imagen principal)
  const displayVariantIdForImage = useMemo(() => {
    if (!useVariantSelectorFlow || !colorAttributeName) return effectiveSelectedVariantId
    const selectedColorValue = variantSelector.selectedAttributes[colorAttributeName]
    if (!selectedColorValue || String(selectedColorValue).trim() === "") return null
    const firstWithColor = productDetail?.variants?.find(
      (v) =>
        (v.attributes[colorAttributeName] ?? "").trim().toLowerCase() ===
        (selectedColorValue ?? "").trim().toLowerCase()
    )
    return firstWithColor?.id ?? null
  }, [
    useVariantSelectorFlow,
    colorAttributeName,
    variantSelector.selectedAttributes,
    productDetail?.variants,
    effectiveSelectedVariantId,
  ])

  // Al seleccionar color/atributos → imagen de esa variante (al deseleccionar por opción se pone 0 en el handler)
  useEffect(() => {
    if (displayVariantIdForImage != null && firstImageIndexByVariantId[String(displayVariantIdForImage)] !== undefined) {
      setSelectedImageIndex(firstImageIndexByVariantId[String(displayVariantIdForImage)])
    }
  }, [displayVariantIdForImage, firstImageIndexByVariantId])

  // Sincronizar variante e imagen al cambiar la variante seleccionada (solo flujo legacy)
  useEffect(() => {
    if (useVariantSelectorFlow) return
    if (selectedVariant) {
      setSelectedVariantId(selectedVariant.id)
      if (selectedVariant.color) setSelectedColor(selectedVariant.color)
    } else {
      setSelectedVariantId(null)
    }
  }, [useVariantSelectorFlow, selectedVariant?.id])

  const variantByColorSize = useMemo(() => {
    const byColor = (c: string) => variants.find((v: { color?: string }) => (v.color ?? '').trim() === (c ?? '').trim())
    const byColorSize = (c: string, s: string) =>
      variants.find(
        (v: { color?: string; size?: string }) =>
          (v.color ?? '').trim() === (c ?? '').trim() && (v.size ?? '').trim() === (s ?? '').trim()
      )
    return { byColor, byColorSize }
  }, [variants])

  const handleAddToCart = async (selectedColor?: string, selectedSize?: string) => {
    if (!product) {
      toast.error('No hay producto para agregar al carrito')
      return
    }
    
    if (productStock <= 0) {
      toast.error('Producto agotado')
      return
    }

    const opciones: Record<string, string> = {}
    if (useVariantSelectorFlow) {
      Object.entries(variantSelector.selectedAttributes).forEach(([attrName, val]) => {
        if (val?.trim()) opciones[attrName] = val.trim()
      })
    } else {
      if (selectedColor?.trim()) opciones.color = selectedColor.trim()
      if (selectedSize?.trim()) opciones.talla = selectedSize.trim()
      Object.entries(selectedAttributes).forEach(([attrId, val]) => {
        if (val?.trim()) opciones[`attr_${attrId}`] = val.trim()
      })
    }

    const cartProductData: Parameters<typeof addToCart>[0] = {
      id_producto: Number(product.id),
      cantidad: 1,
      precio_unitario_carrito: productPrice,
      ...(effectiveSelectedVariantId != null && { variant_id: effectiveSelectedVariantId }),
      ...(Object.keys(opciones).length > 0 && { opciones_elegidas: opciones }),
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

  const hasValidImages = productImagesResolved.length > 0

  const colorIndexToImageIndex = (colorIndex: number) => {
    if (colors.length && allGalleryUrls.length && colors.length === allGalleryUrls.length) {
      return allGalleryUrls.length - 1 - colorIndex
    }
    return colorIndex
  }
  const imageIndexToColorIndex = (imageIndex: number) => {
    if (colors.length && allGalleryUrls.length && allGalleryUrls.length === colors.length) {
      return allGalleryUrls.length - 1 - imageIndex
    }
    return imageIndex
  }

  // Soporta sizes como array, o talla/talla_calzado como string (ej. "M, L, XL") parseado a opciones
  const tallaRaw =
    (product as any).variant_options?.sizes?.[0]?.name ?? product.spcf_producto?.talla ?? product.spcf_producto?.talla_calzado
  const sizes: { name: string; available: boolean }[] =
    (product as any).variant_options?.sizes && Array.isArray((product as any).variant_options.sizes)
      ? (product as any).variant_options.sizes
      : product.spcf_producto?.sizes && Array.isArray(product.spcf_producto.sizes)
      ? product.spcf_producto.sizes
      : tallaRaw
        ? typeof tallaRaw === 'string'
          ? tallaRaw
              .split(',')
              .map((s) => ({ name: s.trim(), available: true }))
              .filter((o) => o.name.length > 0)
          : [{ name: String(tallaRaw), available: true }]
        : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 lg:gap-12 mb-8 md:mb-16">
          {/* Product Gallery: índice sincronizado con el color seleccionado */}
          <div className="w-full">
            <ProductGallery
              images={productImagesResolved}
              productName={product.name}
              selectedIndex={productImagesResolved.length > 0 ? selectedImageIndex : undefined}
              onSelectedIndexChange={(idx) => {
                setSelectedImageIndex(idx)
                // Al cambiar de imagen (flecha o miniatura), deseleccionar color/variante
                setSelectedColor("")
                setSelectedVariantId(null)
                variantSelector.setSelectedAttributes({})
              }}
            />
          </div>

          {/* Product Information: nombre, precio y stock arriba; opciones debajo */}
          <div className="w-full mt-4 lg:mt-0 space-y-6">
            <ProductInfo
              product={{ ...product, num_stock: productStock } as any}
              name={product.name}
              price={productPrice}
              originalPrice={productPrice}
              rating={product.rating != null && product.rating > 0 ? Number(product.rating) : 0}
              reviewCount={product.review_count != null ? Number(product.review_count) : 0}
              colors={useVariantSelectorFlow ? [] : colors}
              sizes={useVariantSelectorFlow ? [] : sizes}
              isNew={false}
              selectedColor={selectedColor}
              onColorChange={useVariantSelectorFlow ? undefined : (value) => {
                if (!value || value.trim() === "") {
                  setSelectedColor("")
                  setSelectedVariantId(null)
                  setSelectedImageIndex(0)
                  return
                }
                setSelectedColor(value)
                const v = variantByColorSize.byColor(value)
                const variantId = v ? (v as { id: number }).id : null
                setSelectedVariantId(variantId)
                const firstIdx = variantId != null ? firstImageIndexByVariantId[String(variantId)] : undefined
                setSelectedImageIndex(firstIdx !== undefined ? firstIdx : 0)
              }}
              onAddToCart={handleAddToCart}
              attributes={useVariantSelectorFlow ? [] : attributesWithAvailability}
              selectedAttributes={useVariantSelectorFlow ? {} : selectedAttributes}
              onAttributeChange={useVariantSelectorFlow ? undefined : (attributeId, value) => {
                setSelectedAttributes((prev) => ({ ...prev, [String(attributeId)]: value }))
              }}
              description={product.description}
              canAddToCartOverride={useVariantSelectorFlow ? !!variantSelector.selectedVariant && productStock > 0 : (attributesWithAvailability.length > 0 ? !!selectedVariant && productStock > 0 : undefined)}
              addToCartDisabledLabel={useVariantSelectorFlow && !variantSelector.selectedVariant ? "Selecciona todas las opciones" : undefined}
              optionsSlot={useVariantSelectorFlow ? (
                <ProductVariantSelector
                  attributeDefinitions={variantSelector.attributeDefinitions}
                  selectedAttributes={variantSelector.selectedAttributes}
                  onSelectAttribute={(attrName, value) => {
                    variantSelector.handleSelectAttribute(attrName, value)
                    if (value === null && attrName === colorAttributeName) setSelectedImageIndex(0)
                  }}
                  isOptionAvailable={variantSelector.isOptionAvailable}
                />
              ) : undefined}
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
                  <span className={`font-medium ${productStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {productStock > 0 ? `${productStock} unidades` : 'Sin stock'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className={`font-medium ${(product as any).ind_activo ?? (product as any).is_active ?? true ? 'text-green-600' : 'text-red-600'}`}>
                    {(product as any).ind_activo ?? (product as any).is_active ?? true ? 'Activo' : 'Inactivo'}
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
                {product.description && (
                  <p className="mb-3">{product.description}</p>
                )}
                {product.spcf_producto && typeof product.spcf_producto === 'object' && Object.keys(product.spcf_producto).length > 0 ? (
                  Object.entries(product.spcf_producto)
                    .filter(([key, value]) => {
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
                ) : !product.description ? (
                  <p>Sin especificaciones disponibles</p>
                ) : null}
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
                  <span className="font-mono text-xs">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categoría:</span>
                  <span>{product.category_name || product.category_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marca:</span>
                  <span>{product.nom_marca || product.id_marca}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proveedor:</span>
                  <span>{String((product as { nom_proveedor?: string; id_proveedor?: string }).nom_proveedor ?? (product as { id_proveedor?: string }).id_proveedor ?? '-')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 md:pt-16">
          <ReviewsSection
            productId={product.slug ?? String(product.id)}
            idProducto={Number(product.id)}
            productName={product.name}
          />
        </div>

        {/* Related Products Section - mismos de la categoría del producto */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 md:pt-16">
          <RelatedProducts
            title="También te puede gustar"
            products={relatedProducts}
          />
        </div>
      </div>

      {/* Cart Toast: imagen según color seleccionado */}
      <CartToast
        isVisible={showCartToast}
        productName={product.name}
        productImage={(() => {
          if (cartData.color && productImagesResolved.length > 0) {
            const v = variantByColorSize.byColor(cartData.color)
            if (v) {
              const idx = firstImageIndexByVariantId[String((v as { id: number }).id)]
              if (idx !== undefined && productImagesResolved[idx]) return productImagesResolved[idx]
            }
          }
          return productImagesResolved[selectedImageIndex] ?? productImagesResolved[0] ?? ''
        })()}
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