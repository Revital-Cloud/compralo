'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProductCreateHeader,
  ProductFormComposite,
  UnifiedProductImagesPanel,
} from '@/components/admin/products';
import { SuccessModal, Button } from '@/components/ui';
import { useCreateProductComposite } from '@/hooks/use-products';
import type { ProductCreateComposite, VariantCreateItem } from '@/types/product';

const FORM_ID = 'product-form-composite';

const ProductCreatePage = () => {
  const router = useRouter();
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [variantsForPreview, setVariantsForPreview] = useState<VariantCreateItem[]>([]);

  const createMutation = useCreateProductComposite();
  const handleVariantsChange = useCallback((variants: VariantCreateItem[]) => {
    setVariantsForPreview(variants);
  }, []);

  const handleSubmit = async (payload: ProductCreateComposite) => {
    try {
      await createMutation.mutateAsync({
        payload,
        imageFiles: selectedImageFiles.length > 0 ? selectedImageFiles : undefined,
      });
      setShowSuccessModal(true);
    } catch {
      // Error ya manejado en el hook
    }
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  const handleGoBack = () => {
    setShowSuccessModal(false);
    router.push('/admin/products');
  };

  return (
    <>
      <div className="space-y-6">
        <ProductCreateHeader />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <ProductFormComposite
              formId={FORM_ID}
              submitLabel="Crear producto"
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
              onVariantsChange={handleVariantsChange}
            />
          </div>
          <div className="xl:col-span-1">
            <UnifiedProductImagesPanel
              onImagesChange={(images) => {
                const files = images.map((img) => img.file).filter(Boolean);
                setSelectedImageFiles(files);
              }}
              maxImages={10}
              maxFileSize={5}
            />
          </div>
        </div>
      </div>

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
