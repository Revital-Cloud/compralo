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
import { useActiveDiscounts } from "@/hooks/use-discounts"
import {
  getApplicableDiscount, 
  calculateDiscountedPrice, 
  calculateDiscountPercentage 
} from "@/utils/discount-utils"

/**
 * Mapa de la página de detalle de producto (`/products/[id]`).
 *
 * Flujo principal:
 * 1) Carga producto por slug/id.
 * 2) Resuelve variantes, atributos e imágenes según selección.
 * 3) Calcula precio visible considerando descuentos activos.
 * 4) Agrega al carrito usando `variant_id` cuando aplique.
 * 5) Muestra reseñas y relacionados por categoría.
 */

const ProductPageContent = () => {
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

  // Productos de la misma categoría para "También te puede gustar" (solo categoría específica, sin subcategorías)
  const categoryId = product?.category_id != null ? Number(product.category_id) : undefined
  const { data: relatedResponse, isLoading: isLoadingRelated, error: errorRelated } = useQuery({
    queryKey: ["relatedProducts", categoryId, slug],
    queryFn: async () => {
      console.log("🔍 [PRODUCT] Buscando productos relacionados para categoría:", categoryId);
      const result = await productService.filterProducts({
        category_id: categoryId!,
        include_subcategories: false, // Solo productos de esta categoría específica
        limit: 9,
        offset: 0,
        ordenar_por: "nombre",
        orden: "ASC",
      });
      console.log("✅ [PRODUCT] Productos encontrados:", result?.products?.length || 0);
      return result;
    },
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

  // Estado y acciones reales de carrito.
  const { 
    addToCart, 
    isAddingToCart,
    error: cartError 
  } = useCart()

  // Descuentos activos para precio final visible en PDP y toast.
  const { data: discounts } = useActiveDiscounts()

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

  // Variantes e imágenes por variante (siempre mismos hooks; product puede ser undefined)
  const variants = useMemo(() => (product as any)?.variants ?? [], [product])
  const imagesByVariant = useMemo(() => (product as any)?.images_by_variant ?? {}, [product])
  const attributesFromApi = useMemo(
    () => (product as { variant_options?: { attributes?: Array<{ attribute_id: number; attribute_name: string; values: Array<{ value: string; hex_color?: string | null; variant_ids: number[] }> }> } })?.variant_options?.attributes ?? [],
    [product]
  )

  // Variantes que coinciden con la selección actual de atributos (filtrado dependiente).
  // Solo exigir selección en atributos donde realmente hay elección (2+ valores).
  const matchingVariantIds = useMemo(() => {
    if (attributesFromApi.length === 0) return new Set(variants.map((v: { id: number }) => v.id))
    const requiredAttrs = attributesFromApi.filter((attr) => (attr.values?.length ?? 0) >= 2)
    const allRequiredSelected = requiredAttrs.every((attr) => {
      const val = (selectedAttributes[String(attr.attribute_id)] ?? "").trim()
      return val !== ""
    })
    if (!allRequiredSelected) return new Set<number>()
    let ids: Set<number> | null = null
    for (const attr of requiredAttrs) {
      const selectedVal = selectedAttributes[String(attr.attribute_id)]
      if (!selectedVal) continue
      const valueObj = attr.values.find((v) => (v.value ?? "").trim() === (selectedVal ?? "").trim())
      const variantIds = (valueObj?.variant_ids ?? []) as number[]
      const vids = new Set<number>(variantIds)
      if (ids === null) ids = vids
      else ids = new Set<number>([...ids].filter((id: number) => vids.has(id)))
    }
    return ids ?? new Set<number>()
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

  const variantGroups = (product as { variant_groups?: Array<{ id: number; dominant_attribute?: string; dominant_value: string; images: Array<{ image_url?: string; is_main?: boolean; sort_order?: number }> }> })?.variant_groups ?? []

  // Preseleccionar primera variante/color solo cuando NO hay atributos (flujo legacy simple).
  // NUNCA preseleccionar atributos por attribute_id: el usuario debe elegir explícitamente.
  useEffect(() => {
    if (useVariantSelectorFlow || !product) return
    if (attributesFromApi.length > 0) {
      // No preseleccionar: selectedAttributes queda vacío hasta que el usuario seleccione
      return
    }
    if (colors.length > 0) {
      const firstColor = colors[0].value
      setSelectedColor(firstColor)
      const firstV = (product as any)?.variants?.find((v: { color?: string }) => (v.color ?? '').trim() === (firstColor ?? '').trim())
      setSelectedVariantId(firstV ? (firstV as { id: number }).id : null)
    } else if ((product as any)?.variants?.length) {
      setSelectedVariantId((product as any).variants[0].id)
    }
  }, [useVariantSelectorFlow, product?.id, colors.length, attributesFromApi.length])

  const dominantValueForGallery = useMemo(() => {
    if (variantGroups.length && variantSelector?.selectedAttributes) {
      // Usar el mismo nombre de atributo que el selector (variant_options.attributes[0].attribute_name)
      const dominantAttrName =
        productDetail?.attributeDefinitions?.[0]?.name ??
        variantGroups[0]?.dominant_attribute ??
        "color"
      const name = String(dominantAttrName || "color").trim()
      const fromSelector =
        variantSelector.selectedAttributes[name] ??
        variantSelector.selectedAttributes["Color"] ??
        variantSelector.selectedAttributes["color"]
      if (fromSelector?.trim()) return String(fromSelector).trim()
    }
    return (selectedColor ?? "").trim()
  }, [variantGroups, selectedColor, variantSelector?.selectedAttributes, productDetail?.attributeDefinitions])

  const selectedGroupForGallery = useMemo(() => {
    if (!variantGroups.length) return null
    const colorVal = dominantValueForGallery.trim().toLowerCase()
    if (!colorVal) {
      // Sin selección: usar el primer grupo que NO sea "Sin color"
      const firstNonSinColor = variantGroups.find(
        (g) => (g.dominant_value ?? "").trim().toLowerCase() !== "sin color"
      )
      return firstNonSinColor ?? variantGroups[0]
    }
    // Buscar el grupo que coincida exactamente con el valor seleccionado
    const found = variantGroups.find((g) => {
      const gVal = (g.dominant_value ?? "").trim().toLowerCase()
      return gVal === colorVal
    })
    // Si no se encuentra, buscar por coincidencia parcial (por si hay diferencias de formato)
    if (!found) {
      const partialMatch = variantGroups.find((g) => {
        const gVal = (g.dominant_value ?? "").trim().toLowerCase()
        return gVal.includes(colorVal) || colorVal.includes(gVal)
      })
      return partialMatch ?? variantGroups[0]
    }
    return found
  }, [variantGroups, dominantValueForGallery])

  // Imágenes del producto (no asociadas a variante) — van siempre primero
  // Si no hay product_images (productos antiguos), usar primer grupo como fallback
  const productImages = useMemo(() => {
    const fromApi = (product as { product_images?: Array<{ image_url?: string; is_main?: boolean; sort_order?: number }> })?.product_images ?? []
    if (fromApi.length) return fromApi
    if (variantGroups.length) return variantGroups[0]?.images ?? []
    return []
  }, [product, variantGroups])

  // Galería: mostrar SIEMPRE todas las imágenes (product_images + todos los grupos de color); al elegir color solo se selecciona la que corresponde
  const { allGalleryUrls, variantIdByIndex, firstImageIndexByVariantId, firstImageIndexForSelectedGroup } = useMemo(() => {
    const urls: string[] = []
    const seenUrls = new Set<string>()
    const variantAtIdx: (number | null)[] = []
    const firstByVariant: Record<string, number> = {}
    const firstIndexByGroupId: Record<number, number> = {}
    let firstSelectedGroupIndex: number | undefined

    const addUrl = (url: string, variantId: number | null) => {
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url)
        urls.push(url)
        variantAtIdx.push(variantId)
        return true
      }
      return false
    }

    if (!product) return { allGalleryUrls: [], variantIdByIndex: [], firstImageIndexByVariantId: {}, firstImageIndexForSelectedGroup: undefined }

    const hasProductImagesFromApi = ((product as { product_images?: unknown[] })?.product_images?.length ?? 0) > 0

    // 1. Imágenes del producto (grupo "Sin color") si vienen de la API
    if (hasProductImagesFromApi && productImages.length) {
      const sorted = [...productImages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      const mainIdx = sorted.findIndex((x) => x.is_main)
      const ordered = mainIdx >= 0 ? [sorted[mainIdx], ...sorted.filter((_, i) => i !== mainIdx)] : sorted
      for (const x of ordered) {
        if (x.image_url) addUrl(x.image_url, null)
      }
    }

    // 2. Imágenes de TODOS los grupos de color (orden estable); se registra el primer índice de cada grupo para seleccionar al elegir color
    for (const group of variantGroups) {
      const isSinColor = (group.dominant_value ?? "").trim().toLowerCase() === "sin color"
      if (isSinColor && hasProductImagesFromApi) continue
      if (!group.images?.length) continue
      const sorted = [...group.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      const mainIdx = sorted.findIndex((x) => x.is_main)
      const ordered = mainIdx >= 0 ? [sorted[mainIdx], ...sorted.filter((_, i) => i !== mainIdx)] : sorted
      const firstUrl = ordered.find((x) => x.image_url)?.image_url ?? null
      let firstIdxForGroup: number | undefined
      for (const x of ordered) {
        if (x.image_url) {
          const before = urls.length
          if (addUrl(x.image_url, null) && firstIdxForGroup === undefined) firstIdxForGroup = before
        }
      }
      if (firstIdxForGroup !== undefined) firstIndexByGroupId[group.id] = firstIdxForGroup
      if (firstIdxForGroup === undefined && firstUrl && urls.length) {
        const idx = urls.findIndex((u) => u === firstUrl)
        if (idx >= 0) firstIndexByGroupId[group.id] = idx
      }
    }
    if (selectedGroupForGallery?.id != null && firstIndexByGroupId[selectedGroupForGallery.id] !== undefined) {
      firstSelectedGroupIndex = firstIndexByGroupId[selectedGroupForGallery.id]
    }

    // 3. Fallback: si no hay product_images ni grupo seleccionado, usar images o image_url del producto
    if (urls.length === 0) {
      const imagesArray = (product as { images?: Array<{ image_url?: string; is_main?: boolean; sort_order?: number }> }).images
      if (imagesArray?.length) {
      const sorted = [...imagesArray].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      for (const x of sorted) {
        if (x.image_url) addUrl(x.image_url, null)
      }
    } else {
      const img = (product as any).image_url ?? (product as any).img_producto
      if (img && typeof img === "object" && "main" in img) {
        const main = (img as { main?: string }).main
        const gallery = (img as { gallery?: string[] }).gallery || []
        if (main) addUrl(main, null)
        gallery.forEach((u: string) => {
          if (u) addUrl(u, null)
        })
      } else if (img && typeof img === "string") {
        addUrl(img, null)
      }
    }
    }

    // 4. Legacy: imágenes por variante (solo si no hay variant_groups)
    if (variantGroups.length === 0) {
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
          if (x.image_url) addUrl(x.image_url, v.id)
        }
      }
    }

    return {
      allGalleryUrls: urls,
      variantIdByIndex: variantAtIdx,
      firstImageIndexByVariantId: firstByVariant,
      firstImageIndexForSelectedGroup: firstSelectedGroupIndex,
    }
  }, [product, productImages, imagesByVariant, selectedGroupForGallery, variantGroups])

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

  // Calcular descuento para el precio mostrado en el toast
  const { discountedPrice, originalPrice, discountPercentage } = useMemo(() => {
    if (!product || !discounts) {
      return { discountedPrice: productPrice, originalPrice: undefined, discountPercentage: undefined }
    }
    const productForDiscount = {
      ...product,
      id_categoria: (product as any).id_categoria ?? (product as any).category_id,
      category_id: (product as any).category_id ?? (product as any).id_categoria,
      id_producto: product.id ?? (product as any).id_producto,
      id_marca: (product as any).id_marca ?? (product as any).marca_id,
    }
    const applicableDiscount = getApplicableDiscount(productForDiscount as any, discounts)
    if (!applicableDiscount) {
      return { discountedPrice: productPrice, originalPrice: undefined, discountPercentage: undefined }
    }
    const original = productPrice
    const discounted = calculateDiscountedPrice(original, applicableDiscount)
    const percentage = calculateDiscountPercentage(original, discounted)
    return {
      discountedPrice: discounted < original ? discounted : original,
      originalPrice: discounted < original ? original : undefined,
      discountPercentage: discounted < original ? percentage : undefined,
    }
  }, [product, productPrice, discounts])

  // Rango de precios (mín y máx de todas las variantes) para mostrar "Desde $X - $Y" cuando no hay variante seleccionada
  const { priceMin, priceMax } = useMemo(() => {
    if (!product) return { priceMin: 0, priceMax: 0 }
    if (variants.length === 0) {
      const p = parseFloat(String((product as any).price_min ?? product.val_precio)) || 0
      return { priceMin: p, priceMax: p }
    }
    const prices = variants
      .map((v: { price?: number }) => (v?.price != null ? parseFloat(String(v.price)) : NaN))
      .filter((n: number) => !Number.isNaN(n))
    if (prices.length === 0) {
      const p = parseFloat(String((product as any).price_min ?? product.val_precio)) || 0
      return { priceMin: p, priceMax: p }
    }
    return { priceMin: Math.min(...prices), priceMax: Math.max(...prices) }
  }, [product, variants])

  const hasVariantSelected = effectiveSelectedVariantId != null

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

  // Al seleccionar color → mostrar primera imagen de ese color (índice real en la galería, con dedup)
  useEffect(() => {
    if (displayVariantIdForImage != null && firstImageIndexByVariantId[String(displayVariantIdForImage)] !== undefined) {
      setSelectedImageIndex(firstImageIndexByVariantId[String(displayVariantIdForImage)])
    } else if (variantGroups.length && selectedGroupForGallery && dominantValueForGallery) {
      // Con variant_groups: usar el índice real de la primera imagen del grupo seleccionado
      if (firstImageIndexForSelectedGroup !== undefined) {
        setSelectedImageIndex(firstImageIndexForSelectedGroup)
      } else if (selectedGroupForGallery.images?.length) {
        // Fallback: si no hay índice calculado, calcularlo basado en si hay product_images desde API
        const hasProductImagesFromApi = ((product as { product_images?: unknown[] })?.product_images?.length ?? 0) > 0
        if (!hasProductImagesFromApi) {
          // Sin product_images: la galería solo tiene el grupo seleccionado, índice 0
          setSelectedImageIndex(0)
        } else {
          // Con product_images: la primera imagen del grupo está después de product_images
          setSelectedImageIndex(productImages.length)
        }
      }
    }
  }, [displayVariantIdForImage, firstImageIndexByVariantId, variantGroups.length, selectedGroupForGallery, dominantValueForGallery, firstImageIndexForSelectedGroup, product, productImages.length])

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

    // Validación: no permitir agregar si no hay una combinación/variante válida seleccionada.
    // Este proyecto usa variant_id (combination id) en el carrito/órdenes.
    const requiresVariantSelection =
      useVariantSelectorFlow ||
      attributesFromApi.length > 0 ||
      (Array.isArray(variants) && variants.length > 0)

    if (requiresVariantSelection && effectiveSelectedVariantId == null) {
      toast.error('Selecciona todas las opciones antes de agregar al carrito')
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
              priceMin={priceMin}
              priceMax={priceMax}
              hasVariantSelected={hasVariantSelected}
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
              addToCartDisabledLabel={
                (useVariantSelectorFlow && !variantSelector.selectedVariant) ||
                (!useVariantSelectorFlow && attributesWithAvailability.length > 0 && !selectedVariant)
                  ? "Selecciona todas las opciones"
                  : undefined
              }
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
                  <span>Categoría:</span>
                  <span>{product.category_name || product.category_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marca:</span>
                  <span>{product.nom_marca || product.id_marca}</span>
                </div>
                <div className="flex justify-between">
                  <span>Proveedor:</span>
                  <span>{(product as { nom_proveedor?: string }).nom_proveedor || '-'}</span>
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
        price={discountedPrice}
        originalPrice={originalPrice}
        discountPercentage={discountPercentage}
        selectedColor={cartData.color}
        selectedSize={cartData.size}
        onClose={() => setShowCartToast(false)}
        onViewCart={handleViewCart}
      />
      {product && typeof window !== "undefined" && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              image: productImagesResolved,
              description: product.description,
              sku: (product as any).sku ?? undefined,
              brand: product.nom_marca
                ? {
                    "@type": "Brand",
                    name: product.nom_marca,
                  }
                : undefined,
              offers: {
                "@type": "Offer",
                priceCurrency: "COP",
                price: discountedPrice,
                availability:
                  productStock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: `${window.location.origin}/products/${slug}`,
              },
            }),
          }}
        />
      )}
    </div>
  )
}

function ProductPage() {
  const params = useParams()
  const slug = (params?.id as string) ?? ""
  return <ProductPageContent key={slug} />
}

export default ProductPage