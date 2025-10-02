'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { 
  ProductCreateHeader, 
  ProductForm, 
  ProductImageUpload 
} from "@/components/admin/products";
import { useCreateProduct } from "@/hooks/use-products";
import * as productService from "@/services/product.service";
import type { ProductCreate } from '@/types';

const ProductCreatePage = () => {
  const router = useRouter();
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  
  // Hook para crear productos
  const createProductMutation = useCreateProduct();

  // Manejar envío del formulario
  const handleFormSubmit = async (formData: any) => {
    try {
      // Preparar datos del producto
      const productData: ProductCreate = {
        ...formData,
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
      
      // Redirigir a la lista de productos
      router.push('/admin/products');
      
    } catch (error) {
      // El error ya se maneja en el hook
      console.error('Error al crear producto:', error);
    }
  };

  // Manejar cambio de imágenes
  const handleImagesChange = (images: any[]) => {
    setSelectedImages(images);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProductCreateHeader />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <ProductForm 
            onSubmit={handleFormSubmit}
            isLoading={createProductMutation.isPending}
          />
        </div>

        {/* Image Upload Section */}
        <div className="xl:col-span-1">
          <ProductImageUpload 
            onImagesChange={handleImagesChange}
            maxImages={10}
            maxFileSize={5}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCreatePage; 