'use client';

import { Badge } from '@repo/ui';
import { Package } from 'lucide-react';
import ProductGallery from '../product/product-gallery';
import { formatPrice } from '@/utils/format-price';

interface ProductCardProps {
  product: {
    id_producto: number;
    nom_producto: string;
    val_precio?: number;
    stock_cantidad?: number;
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
  const isAvailable = product.stock_cantidad && product.stock_cantidad > 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${className}`}
      onClick={onClick}
    >
      {product.img_producto ? (
        <ProductGallery
          images={[product.img_producto.main, ...(product.img_producto.gallery || [])]}
          productName={product.nom_producto}
        />
      ) : (
        <div className="aspect-square bg-gray-200 flex items-center justify-center">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.nom_producto}
        </h3>
        <p className="text-lg font-bold text-blue-600 mb-2">
          {formatPrice(product.val_precio, 'COP')}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Stock: {product.stock_cantidad || 0}
          </span>
          {isAvailable ? (
            <Badge variant="default" className="text-xs">
              Disponible
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              Sin stock
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
