'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ProductCreateHeader,
  ProductFormComposite,
  UnifiedProductImagesPanel,
} from '@/components/admin/products';
import { SuccessModal, Button } from '@/components/ui';
import { useCreateProductComposite } from '@/hooks/use-products';
import type { ProductCreateComposite, VariantCreateItem } from '@/types/product';
import { useAdminTour } from '../../_tour/useAdminDriverTour';

const FORM_ID = 'product-form-composite';
const PRODUCT_CREATE_TOUR_KEY = 'revital_product_create_tour_seen';

const ProductCreatePage = () => {
  const router = useRouter();
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [variantsForPreview, setVariantsForPreview] = useState<VariantCreateItem[]>([]);

  const createMutation = useCreateProductComposite();
  const { startProductCreateTour } = useAdminTour();
  const handleVariantsChange = useCallback((variants: VariantCreateItem[]) => {
    setVariantsForPreview(variants);
  }, []);

  const handleSubmit = async (payload: ProductCreateComposite) => {
    if (selectedImageFiles.length === 0) {
      toast.error('La imagen principal es obligatoria');
      return;
    }
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

  useEffect(() => {
    try {
      const seen = localStorage.getItem(PRODUCT_CREATE_TOUR_KEY);
      if (!seen) {
        startProductCreateTour();
        localStorage.setItem(PRODUCT_CREATE_TOUR_KEY, '1');
      }
    } catch {
      // ignore
    }
  }, [startProductCreateTour]);

  return (
    <>
      <div className="space-y-6" data-tour-id="product-create-header">
        <ProductCreateHeader />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2" data-tour-id="product-main-form">
            <ProductFormComposite
              formId={FORM_ID}
              submitLabel="Crear producto"
              onSubmit={handleSubmit}
              isLoading={createMutation.isPending}
              onVariantsChange={handleVariantsChange}
            />
          </div>
          <div className="xl:col-span-1" data-tour-id="product-images-panel">
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
