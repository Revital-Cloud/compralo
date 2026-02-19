'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import type { VariantCreateItem } from '@/types/product';
import { cn } from '@/lib/utils';

export interface VariantImagesCarouselProps {
  variants: VariantCreateItem[];
  selectedVariantIndex: number;
  onSelectVariantIndex: (index: number) => void;
}

export function VariantImagesCarousel({
  variants,
  selectedVariantIndex,
  onSelectVariantIndex,
}: VariantImagesCarouselProps) {
  const variant = variants[selectedVariantIndex];
  const urls = variant?.image_urls ?? [];
  const mainIndex = variant?.main_index ?? 0;
  const mainUrl = urls[mainIndex] ?? urls[0];
  const gallery = urls.filter((_, i) => i !== (mainIndex >= 0 ? mainIndex : 0));

  if (variants.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Imágenes por variante</CardTitle>
        <p className="text-xs text-muted-foreground">
          Vista previa de las imágenes de cada variante
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectVariantIndex(i)}
              className={cn(
                'px-2 py-1 rounded text-sm border transition-colors',
                selectedVariantIndex === i
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 border-transparent hover:bg-muted'
              )}
            >
              Variante {i + 1}
              {(v.image_urls?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">
                  {(v.image_urls?.length ?? 0)}
                </Badge>
              )}
            </button>
          ))}
        </div>
        {variant && (
          <div className="space-y-2">
            {urls.length === 0 ? (
              <div className="aspect-square rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
                Sin imágenes en esta variante
              </div>
            ) : (
              <>
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                  <img
                    src={mainUrl}
                    alt={`Variante ${selectedVariantIndex + 1} principal`}
                    className="w-full h-full object-contain"
                  />
                </div>
                {gallery.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {urls.map((url, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-shrink-0 w-12 h-12 rounded border overflow-hidden',
                          (mainIndex === i || (mainIndex === 0 && i === 0)) && 'ring-2 ring-primary'
                        )}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
