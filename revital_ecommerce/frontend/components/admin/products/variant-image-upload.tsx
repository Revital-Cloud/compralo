'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { uploadProductImage } from '@/services/product.service';
import { cn } from '@/lib/utils';

const MAX_FILES = 10;
const MAX_SIZE_MB = 5;

export interface VariantImageUploadProps {
  variantIndex: number;
  imageUrls: string[];
  mainIndex: number;
  onUrlsChange: (urls: string[]) => void;
  onMainIndexChange: (index: number) => void;
  onRemoveUrl: (index: number) => void;
  disabled?: boolean;
}

export function VariantImageUpload({
  variantIndex,
  imageUrls,
  mainIndex,
  onUrlsChange,
  onMainIndexChange,
  onRemoveUrl,
  disabled,
}: VariantImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (imageUrls.length + acceptedFiles.length > MAX_FILES) {
        toast.error(`Máximo ${MAX_FILES} imágenes por variante`);
        return;
      }
      setUploading(true);
      const newUrls: string[] = [];
      try {
        for (const file of acceptedFiles) {
          const { url } = await uploadProductImage(file);
          newUrls.push(url);
        }
        if (newUrls.length) {
          onUrlsChange([...imageUrls, ...newUrls]);
          toast.success(`${newUrls.length} imagen(es) subida(s)`);
        }
      } catch (e: unknown) {
        const msg = e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : (e as Error)?.message;
        toast.error(msg || 'Error al subir la imagen');
      } finally {
        setUploading(false);
      }
    },
    [imageUrls, onUrlsChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: true,
    disabled: disabled || uploading || imageUrls.length >= MAX_FILES,
  });

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          (disabled || uploading || imageUrls.length >= MAX_FILES) && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <IconUpload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
        {uploading ? (
          <p className="text-muted-foreground">Subiendo...</p>
        ) : (
          <p className="text-muted-foreground">
            {imageUrls.length >= MAX_FILES
              ? 'Máximo alcanzado'
              : 'Arrastra imágenes aquí o haz clic (máx. ' + MAX_SIZE_MB + 'MB)'}
          </p>
        )}
      </div>
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative group border rounded overflow-hidden bg-muted">
              <img src={url} alt="" className="w-14 h-14 object-cover" />
              <label className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] flex items-center justify-center gap-1 py-0.5">
                <input
                  type="radio"
                  name={`variant-${variantIndex}-main`}
                  checked={mainIndex === i}
                  onChange={() => onMainIndexChange(i)}
                />
                Principal
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-6 w-6 text-red-600 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100"
                onClick={() => onRemoveUrl(i)}
                aria-label="Quitar"
              >
                <IconTrash className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
