'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProductCreateHeader, ProductForm, ProductImageUpload } from '@/components/admin/products';
import { useProductAdminDetail, useUpdateProduct } from '@/hooks/use-products';
import type { ProductCreate } from '@/types';

const ProductEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.id as string) || '';
  const [selectedImages, setSelectedImages] = useState<any[]>([]);

  const { data: product, isLoading, error } = useProductAdminDetail(slug);
  const updateProductMutation = useUpdateProduct();

  const initialData = useMemo(() => {
    if (!product) return undefined;
    return {
      nom_producto: product.nom_producto ?? '',
      des_producto: product.spcf_producto?.descripcion || product.spcf_producto?.des_producto || '',
      val_precio: String(product.val_precio ?? ''),
      num_stock: String(product.num_stock ?? ''),
      id_categoria: String(product.id_categoria ?? ''),
      id_marca: String(product.id_marca ?? ''),
      id_linea: String(product.id_linea ?? ''),
      id_sublinea: String(product.id_sublinea ?? ''),
      id_proveedor: String(product.id_proveedor ?? ''),
      cod_producto: product.spcf_producto?.cod_producto || '',
      tags: Array.isArray(product.spcf_producto?.tags) ? product.spcf_producto.tags : [],
      spcf_producto: product.spcf_producto ?? {},
    } as any;
  }, [product]);

  const handleFormSubmit = async (formData: any) => {
    try {
      console.log('=== EDIT PAGE DEBUG ===');
      console.log('Product ID:', product?.id_producto);
      console.log('Form data received:', formData);
      console.log('Selected images:', selectedImages);

      const idNumber = Number(product?.id_producto);
      if (!idNumber || Number.isNaN(idNumber)) {
        toast.error('ID de producto inválido');
        return;
      }

      // Usar los IDs actuales del formulario, no los originales
      const currentIdCategoria = Number(formData.id_categoria);
      const currentIdLinea = Number(formData.id_linea);
      const currentIdSublinea = Number(formData.id_sublinea);

      // Valores numéricos: evitar NaN; si el form devuelve inválido, usar datos actuales del producto
      const valPrecio = Number(formData.val_precio);
      const numStock = Number(formData.num_stock);
      const idProveedor = Number(formData.id_proveedor);
      const idMarca = Number(formData.id_marca);
      const safeValPrecio = Number.isFinite(valPrecio) && valPrecio > 0 ? valPrecio : Number(product?.val_precio) || 0;
      const safeNumStock = Number.isFinite(numStock) && numStock >= 0 ? numStock : Number(product?.num_stock) ?? 0;
      const safeIdProveedor = Number.isFinite(idProveedor) && idProveedor > 0 ? idProveedor : Number(product?.id_proveedor) || 1;
      const safeIdMarca = Number.isFinite(idMarca) && idMarca > 0 ? idMarca : Number(product?.id_marca) || 1;

      // Preparar FormData para el backend (siempre strings para Form)
      const formDataToSend = new FormData();
      formDataToSend.append('nom_producto', String(formData.nom_producto ?? product?.nom_producto ?? ''));
      formDataToSend.append('spcf_producto', JSON.stringify(formData.spcf_producto ?? {}));
      formDataToSend.append('val_precio', String(safeValPrecio));
      formDataToSend.append('id_proveedor', String(safeIdProveedor));
      formDataToSend.append('id_marca', String(safeIdMarca));
      formDataToSend.append('num_stock', String(safeNumStock));
      formDataToSend.append('ind_activo', 'true');

      // Manejar imágenes: enviar existentes si no hay nuevas, o nuevas si las hay
      if (selectedImages.length > 0) {
        // Hay nuevas imágenes seleccionadas
        selectedImages.forEach((image, index) => {
          if (image.file) {
            formDataToSend.append('image_files', image.file);
          }
        });
      } else {
        // No hay nuevas imágenes, mantener las existentes
        if (product?.img_producto) {
          formDataToSend.append('img_producto', JSON.stringify(product.img_producto));
        }
      }

      console.log('Final form data to send:', Object.fromEntries(formDataToSend.entries()));
      
      await updateProductMutation.mutateAsync({ 
        id_categoria: currentIdCategoria, 
        id_linea: currentIdLinea, 
        id_sublinea: currentIdSublinea, 
        id_producto: idNumber, 
        data: formDataToSend as any
      });
      console.log('Update successful, redirecting...');
      router.push('/admin/products');
    } catch (e: any) {
      // El hook ya muestra toast de error
      console.error('Error updating product:', e);
      console.error('Error details:', e?.response?.data);
    }
  };

  // Manejar cambio de imágenes
  const handleImagesChange = (images: any[]) => {
    setSelectedImages(images);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <ProductCreateHeader 
          title="Editar Producto"
          description="Actualiza los datos del producto"
          backUrl="/admin/products"
        />
        <div className="text-red-600">Error al cargar el producto.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductCreateHeader 
        title="Editar Producto"
        description="Actualiza los datos del producto"
        backUrl="/admin/products"
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <ProductForm 
            initialData={initialData}
            isLoading={isLoading || updateProductMutation.isPending}
            submitLabel="GUARDAR CAMBIOS"
            onSubmit={handleFormSubmit}
            isEditing={true} // Indicar que estamos editando
          />
        </div>

        {/* Image Upload Section */}
        <div className="xl:col-span-1">
          <ProductImageUpload 
            onImagesChange={handleImagesChange}
            maxImages={10}
            maxFileSize={5}
            existingImages={product?.img_producto}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductEditPage;