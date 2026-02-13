'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import {
  ProductCreateHeader,
  ProductForm,
  type ProductFormRef,
  ProductImageUpload,
} from "@/components/admin/products";
import { SuccessModal, Button } from "@/components/ui";
import { useCreateProduct } from "@/hooks/use-products";
import * as productService from "@/services/product.service";
import type { ProductCreate } from '@/types';

const FORM_ID = 'product-form';

const ProductCreatePage = () => {
  const router = useRouter();
  const formRef = useRef<ProductFormRef>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const createProductMutation = useCreateProduct();

  // Manejar envío del formulario
  const handleFormSubmit = async (formData: any) => {
    try {
      // Preparar datos del producto
      const productData: any = {
        ...formData,
        val_precio: formData.val_precio,
        // Aquí podrías procesar las imágenes si es necesario
        img_producto: selectedImages.length > 0 ? {
          main: selectedImages[0]?.preview || '',
          gallery: selectedImages.slice(1).map(img => img.preview),
          thumbnails: selectedImages.map(img => img.preview)
        } : undefined,
        // Convertir tags a especificaciones si es necesario
        spcf_producto: {
          ...formData.spcf_producto,
          tags: formData.tags
        }
      };

      // Crear el producto usando form-data (el backend espera Form fields)
      const imageFiles: File[] = selectedImages
        .map((img: any) => img?.file)
        .filter((f: File | undefined) => !!f);

      // Si hay imágenes, enviamos con archivos; si no, igual usamos form-data para cumplir el backend
      if (imageFiles.length > 0) {
        await productService.createProductWithImages(productData, imageFiles);
      } else {
        // Enviar como form-data sin archivos
        await productService.createProductWithImages(productData, []);
      }
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
    } catch (error) {
      // El error ya se maneja en el hook
      console.error('Error al crear producto:', error);
    }
  };

  // Manejar continuar después del éxito
  const handleContinue = () => {
    setShowSuccessModal(false);
    // Refrescar la página para mostrar los datos actualizados
    window.location.reload();
  };

  // Manejar volver a la lista
  const handleGoBack = () => {
    setShowSuccessModal(false);
    router.push('/admin/products');
  };

  // Manejar cambio de imágenes
  const handleImagesChange = (images: any[]) => {
    setSelectedImages(images);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <ProductCreateHeader />

        {/* Main Content: formulario e imágenes; botones siempre al final en responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <ProductForm
              ref={formRef}
              formId={FORM_ID}
              hideActionButtons
              onSubmit={handleFormSubmit}
              isLoading={createProductMutation.isPending}
            />
          </div>
          <div className="xl:col-span-1">
            <ProductImageUpload
              onImagesChange={handleImagesChange}
              maxImages={10}
              maxFileSize={5}
            />
          </div>
          <div className="col-span-1 xl:col-span-3 flex flex-wrap items-center justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => formRef.current?.reset()}>
              LIMPIAR
            </Button>
            <Button
              type="submit"
              form={FORM_ID}
              disabled={createProductMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {createProductMutation.isPending ? 'GUARDANDO...' : 'CREAR PRODUCTO'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de éxito */}
      <SuccessModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        title="¡Producto creado exitosamente!"
        description="El producto ha sido creado y agregado al catálogo. ¿Qué deseas hacer ahora?"
        onContinue={handleContinue}
        onGoBack={handleGoBack}
        continueText="Crear otro producto"
        goBackText="Ver lista de productos"
      />
    </>
  );
};

export default ProductCreatePage; 