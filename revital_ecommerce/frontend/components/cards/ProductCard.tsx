'use client';

import { Badge } from "@/components/ui";
import { Package } from 'lucide-react';
import ProductGallery from '../product/product-gallery';
import { formatPrice } from '@/utils/format-price';

interface ProductCardProps {
  product: {
    id_producto: number;
    nom_producto: string;
    val_precio?: number;
    stock_cantidad?: number;
    num_stock?: number;
    img_producto?: {
      main: string;
      gallery: string[];
      thumbnails: string[];
    };
  };
  onClick?: () => void;
  className?: string;
}

export function ProductCard({ product, onClick, className = '' }: ProductCardProps) {
  const stock = product.num_stock ?? product.stock_cantidad ?? 0;
  const isAvailable = stock > 0;

  return (
    <div
      className={`bg-card text-card-foreground rounded-lg border border-border shadow-md overflow-hidden hover:shadow-lg transition-shadow ${className} flex flex-col h-full`}
    >
      <div className="flex-none">
        {product.img_producto ? (
          <ProductGallery
            images={[
              product.img_producto.main,
              ...(product.img_producto.gallery || []),
            ]}
            productName={product.nom_producto}
            onMainImageClick={onClick}
          />
        ) : (
          <div
            className="aspect-square bg-muted flex items-center justify-center cursor-pointer"
            onClick={onClick}
            role="button"
            aria-label="Ver detalle del producto"
          >
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="p-4 mt-auto">
        <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">
          {product.nom_producto}
        </h3>
        <p className="text-lg font-bold text-primary mb-2">
          {formatPrice(product.val_precio ?? 0, 'COP')}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground font-medium">
            Stock: {stock}
          </span>
          {isAvailable ? (
            <Badge variant="default" className="text-xs shrink-0">
              Disponible
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs shrink-0">
              Sin stock
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
