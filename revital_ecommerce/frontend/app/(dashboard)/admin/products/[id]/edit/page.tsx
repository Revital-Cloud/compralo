'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ProductCreateHeader,
  ProductFormComposite,
  UnifiedProductImagesPanel,
} from '@/components/admin/products'
import {
  getProductAdminDetailById,
  updateProductComposite,
  type ProductAdminDetailComposite,
} from '@/services/product.service'
import type { ProductCreateComposite, VariantCreateItem } from '@/types/product'
import { useQuery } from '@tanstack/react-query'
import { AdminFormSkeleton } from '@/components/admin/skeletons'

const FORM_ID = 'product-form-composite-edit'

export default function ProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string
  const [selectedImages, setSelectedImages] = useState<{ file?: File; preview?: string }[]>([])
  const productImageFilesRef = useRef<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [variantsForPreview, setVariantsForPreview] = useState<VariantCreateItem[]>([])
  const [productImageUrls, setProductImageUrls] = useState<string[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['product-admin-detail', productId],
    queryFn: () => getProductAdminDetailById(productId),
    enabled: !!productId && /^\d+$/.test(productId),
  })

  useEffect(() => {
    if (data?.image_urls && Array.isArray(data.image_urls)) {
      setProductImageUrls(data.image_urls)
    } else {
      setProductImageUrls([])
    }
  }, [data?.image_urls])

  useEffect(() => {
    const files = selectedImages.map((img) => img?.file).filter((f): f is File => !!f)
    productImageFilesRef.current = files
  }, [selectedImages])

  const handleVariantsChange = useCallback((variants: VariantCreateItem[]) => {
    setVariantsForPreview(variants)
  }, [])

  const handleSubmit = async (payload: ProductCreateComposite) => {
    if (!productId) return
    try {
      setIsSubmitting(true)
      const imageFiles = productImageFilesRef.current.length > 0 ? productImageFilesRef.current : selectedImages.map((img) => img?.file).filter((f): f is File => !!f)
      const hasMainImage = productImageUrls.length > 0 || imageFiles.length > 0
      if (!hasMainImage) {
        toast.error('La imagen principal es obligatoria')
        return
      }
      const payloadWithExistingImages: ProductCreateComposite = {
        ...payload,
        // Usar SIEMPRE el estado local para reflejar la edición/remoción del usuario.
        image_urls: [...productImageUrls],
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
    productImageUrls.length > 0
      ? productImageUrls.length === 1
        ? { main: productImageUrls[0], gallery: [] as string[] }
        : { main: productImageUrls[0], gallery: productImageUrls.slice(1) }
      : undefined

  const handleRemoveProductImage = useCallback((url: string) => {
    setProductImageUrls((prev) => prev.filter((u) => u !== url))
  }, [])

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
            <AdminFormSkeleton fields={10} />
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
        <div className="xl:col-span-1">
          <UnifiedProductImagesPanel
            onImagesChange={setSelectedImages}
            maxImages={10}
            maxFileSize={5}
            existingImages={existingImagesForUpload}
            onRemoveExistingImage={handleRemoveProductImage}
          />
        </div>
      </div>
    </div>
  )
}
