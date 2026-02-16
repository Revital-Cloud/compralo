'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { VariantCreateItem } from '@/types/product';
import { cn } from '@/lib/utils';

export interface AllVariantImagesListProps {
  variants: VariantCreateItem[];
}

/**
 * Muestra las imágenes de todas las variantes en una sola vista (sin selector por variante).
 */
export function AllVariantImagesList({ variants }: AllVariantImagesListProps) {
  if (variants.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Imágenes de las variantes</CardTitle>
        <p className="text-xs text-muted-foreground">
          Todas las imágenes por variante en una sola vista
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant, index) => {
          const urls = variant.image_urls ?? [];
          const mainIndex = variant.main_index ?? 0;
          const mainUrl = urls[mainIndex] ?? urls[0];

          return (
            <div key={index} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Variante {index + 1}
                {urls.length > 0 && (
                  <span className="ml-2 text-xs font-normal">
                    ({urls.length} imagen{urls.length !== 1 ? 'es' : ''})
                  </span>
                )}
              </h4>
              {urls.length === 0 ? (
                <div className="flex gap-2 flex-wrap">
                  <div className="w-20 h-20 rounded-lg border border-dashed bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                    Sin imágenes
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {urls.map((url, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-20 h-20 rounded-lg overflow-hidden border-2 bg-muted flex-shrink-0',
                        (i === mainIndex || (mainIndex === 0 && i === 0))
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border'
                      )}
                    >
                      <img
                        src={url}
                        alt={`Variante ${index + 1} imagen ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
