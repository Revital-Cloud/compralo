'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ProductCreateHeader,
  ProductFormComposite,
  ProductImageUpload,
  VariantImagesCarousel,
} from '@/components/admin/products'
import {
  getProductAdminDetailById,
  updateProductComposite,
  type ProductAdminDetailComposite,
} from '@/services/product.service'
import type { ProductCreateComposite, VariantCreateItem } from '@/types/product'
import { useQuery } from '@tanstack/react-query'

const FORM_ID = 'product-form-composite-edit'

export default function ProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const [selectedImages, setSelectedImages] = useState<{ file?: File; preview?: string }[]>([])
  const productImageFilesRef = useRef<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [variantsForPreview, setVariantsForPreview] = useState<VariantCreateItem[]>([])
  const [selectedVariantPreviewIndex, setSelectedVariantPreviewIndex] = useState(0)

  useEffect(() => {
    const files = selectedImages.map((img) => img?.file).filter((f): f is File => !!f)
    productImageFilesRef.current = files
  }, [selectedImages])

  const handleVariantsChange = useCallback((variants: VariantCreateItem[]) => {
    setVariantsForPreview(variants)
    setSelectedVariantPreviewIndex((i) => (i >= variants.length ? Math.max(0, variants.length - 1) : i))
  }, [])

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-admin-detail', productId],
    queryFn: () => getProductAdminDetailById(productId),
    enabled: !!productId && /^\d+$/.test(productId),
  })

  const handleSubmit = async (payload: ProductCreateComposite) => {
    if (!productId) return
    try {
      setIsSubmitting(true)
      const imageFiles = productImageFilesRef.current.length > 0 ? productImageFilesRef.current : selectedImages.map((img) => img?.file).filter((f): f is File => !!f)
      const existingProductUrls = data?.image_urls ?? []
      const payloadWithExistingImages: ProductCreateComposite = {
        ...payload,
        image_urls: existingProductUrls.length > 0 ? [...existingProductUrls] : (payload.image_urls ?? []),
      }
      await updateProductComposite(productId, payloadWithExistingImages, imageFiles)
      toast.success('Producto actualizado correctamente')
      router.push('/admin/products')
    } catch (err: unknown) {
      console.error('Error al actualizar producto:', err)
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : (err as Error)?.message
      toast.error(msg || 'Error al actualizar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const existingImagesForUpload =
    data?.image_urls?.length !== undefined && data.image_urls.length > 0
      ? data.image_urls.length === 1
        ? { main: data.image_urls[0], gallery: [] as string[] }
        : { main: data.image_urls[0], gallery: data.image_urls.slice(1) }
      : undefined

  if (error) {
    return (
      <div className="space-y-6">
        <ProductCreateHeader title="Editar Producto" description="Actualiza los datos del producto" backUrl="/admin/products" />
        <div className="text-red-600">Error al cargar el producto.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductCreateHeader
        title="Editar Producto"
        description="Actualiza los datos del producto"
        backUrl="/admin/products"
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="text-muted-foreground">Cargando producto...</div>
          ) : (
            <ProductFormComposite
              formId={FORM_ID}
              initialData={data as ProductAdminDetailComposite | undefined}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
              submitLabel="Guardar cambios"
              onVariantsChange={handleVariantsChange}
            />
          )}
        </div>
        <div className="xl:col-span-1 space-y-6">
          <ProductImageUpload
            onImagesChange={setSelectedImages}
            maxImages={10}
            maxFileSize={5}
            existingImages={existingImagesForUpload}
          />
          <VariantImagesCarousel
            variants={variantsForPreview}
            selectedVariantIndex={selectedVariantPreviewIndex}
            onSelectVariantIndex={setSelectedVariantPreviewIndex}
          />
        </div>
      </div>
    </div>
  )
}
