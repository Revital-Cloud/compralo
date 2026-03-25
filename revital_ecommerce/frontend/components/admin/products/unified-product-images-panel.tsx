'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { IconUpload, IconCamera, IconTrash } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  file: File;
  preview: string;
  loaded: boolean;
  error: boolean;
}

type ImageEntry = { type: 'product'; url: string; id: string; canRemove: boolean };

export interface UnifiedProductImagesPanelProps {
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
  maxFileSize?: number;
  /** Imágenes de producto (solo panel derecho; no se mezclan con variantes) */
  existingImages?: { main?: string; gallery?: string[] };
  /** Al eliminar una imagen existente del panel */
  onRemoveExistingImage?: (url: string) => void;
}

export function UnifiedProductImagesPanel({
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5,
  existingImages,
  onRemoveExistingImage,
}: UnifiedProductImagesPanelProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!existingImages) {
      setExistingUrls([]);
      return;
    }
    const urls: string[] = [];
    if (existingImages.main) urls.push(existingImages.main);
    if (Array.isArray(existingImages.gallery)) urls.push(...existingImages.gallery);
    setExistingUrls(urls);
  }, [existingImages]);

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      });
    };
  }, [images]);

  // Solo imágenes de producto (panel derecho). Las variantes tienen sus propias secciones.
  const allEntries = useMemo((): ImageEntry[] => {
    const list: ImageEntry[] = [];
    const seenUrls = new Set<string>();
    images.forEach((img) => {
      const key = img.preview;
      if (seenUrls.has(key)) return;
      seenUrls.add(key);
      list.push({ type: 'product', url: img.preview, id: img.id, canRemove: true });
    });
    // Si hay solo 1 imagen existente y el usuario no ha subido nuevas, no permitimos borrarla
    // para cumplir la regla de "imagen principal obligatoria" en edición.
    const canRemoveExisting = !!onRemoveExistingImage && !(existingUrls.length === 1 && images.length === 0);
    existingUrls.forEach((url, i) => {
      const key = url.trim();
      if (!key || seenUrls.has(key)) return;
      seenUrls.add(key);
      list.push({ type: 'product', url, id: `existing-${i}`, canRemove: canRemoveExisting });
    });
    return list;
  }, [existingUrls, images, onRemoveExistingImage]);

  const selectedUrl = allEntries[selectedIndex]?.url ?? null;
  useEffect(() => {
    if (selectedIndex >= allEntries.length && allEntries.length > 0) {
      setSelectedIndex(allEntries.length - 1);
    }
    if (allEntries.length > 0 && selectedIndex < 0) setSelectedIndex(0);
  }, [allEntries.length, selectedIndex]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newImages: ProductImage[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).slice(2, 9),
        file,
        preview: URL.createObjectURL(file),
        loaded: false,
        error: false,
      }));
      const updated = [...newImages, ...images].slice(0, maxImages);
      setImages(updated);
      onImagesChange(updated);
      setSelectedIndex(0);
      if (acceptedFiles.length > 0) toast.success(`${acceptedFiles.length} imagen(es) agregada(s)`);
    },
    [images, maxImages, onImagesChange]
  );

  const removeImage = useCallback(
    (imageId: string) => {
      const img = images.find((i) => i.id === imageId);
      if (img?.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      const updated = images.filter((i) => i.id !== imageId);
      setImages(updated);
      onImagesChange(updated);
      toast.info('Imagen removida');
    },
    [images, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: maxFileSize * 1024 * 1024,
    multiple: true,
    disabled: images.length + existingUrls.length >= maxImages,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imágenes del producto</CardTitle>
        <CardDescription>
          Imágenes del producto. Haz clic en una miniatura para verla arriba. Sube hasta {maxImages} imágenes (JPEG, PNG, WebP, máx. {maxFileSize}MB). Las variantes tienen sus propias imágenes en cada sección.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Una sola vista previa grande */}
        <div className="w-full aspect-square max-h-80 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {selectedUrl ? (
            <img
              src={selectedUrl}
              alt="Vista previa"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <IconCamera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sin imágenes</p>
              <p className="text-xs mt-1">Sube imágenes del producto aquí</p>
            </div>
          )}
        </div>

        {/* Una sola lista de miniaturas: producto + variantes */}
        {allEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Imágenes del producto ({allEntries.length}) — haz clic para ver arriba
            </p>
            <div className="flex flex-wrap gap-2">
              {allEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    'relative w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-opacity hover:opacity-90',
                    selectedIndex === index ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                  )}
                  onClick={() => setSelectedIndex(index)}
                >
                  <img src={entry.url} alt="" className="w-full h-full object-cover" />
                  {entry.canRemove && (
                    <button
                      type="button"
                      className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (entry.id.startsWith('existing')) {
                          onRemoveExistingImage?.(entry.url);
                          toast.info('Imagen removida');
                        } else {
                          removeImage(entry.id);
                        }
                      }}
                      aria-label="Eliminar"
                    >
                      <IconTrash className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zona de subida (solo para imágenes del producto) */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-muted-foreground/50',
            images.length + existingUrls.length >= maxImages && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <IconUpload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Suelta aquí' : 'Arrastra imágenes del producto o haz clic'}
          </p>
          <p className="text-xs text-muted-foreground/80">
            {images.length + existingUrls.length}/{maxImages} imágenes
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
