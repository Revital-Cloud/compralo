'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, ShoppingCart, Heart, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { ProductImageGallery } from './ProductImageGallery';
import { Product } from '@/types/hierarchical';

interface ProductDetailProps {
  product: Product;
  onAddToCart?: () => void;
  onAddToFavorites?: () => void;
  className?: string;
}

export function ProductDetail({ 
  product, 
  onAddToCart, 
  onAddToFavorites, 
  className = '' 
}: ProductDetailProps) {
  const isAvailable = product.stock_cantidad && product.stock_cantidad > 0;
  const hasImages = product.img_producto && product.img_producto.main;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${className}`}>
      {/* Galería de imágenes */}
      <div className="space-y-4">
        {hasImages ? (
          <ProductImageGallery
            images={product.img_producto || { main: '', gallery: [], thumbnails: [] }}
            productName={product.nom_producto}
            className="w-full"
          />
        ) : (
          <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
            <Package className="w-24 h-24 text-gray-400" />
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div className="space-y-6">
        {/* Título y precio */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {product.nom_producto}
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-3xl font-bold text-blue-600">
              ${product.val_precio?.toLocaleString() || '0'}
            </p>
            {isAvailable ? (
              <Badge variant="default" className="text-sm">
                En stock
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-sm">
                Sin stock
              </Badge>
            )}
          </div>
        </div>

        {/* Especificaciones */}
        {product.desc_producto && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Especificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(product.desc_producto as Record<string, any>).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1">
                    <span className="font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock y disponibilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Disponibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stock disponible:</span>
                <span className="font-semibold">{product.stock_cantidad || 0} unidades</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado:</span>
                <Badge variant={isAvailable ? "default" : "destructive"}>
                  {isAvailable ? "Disponible" : "Agotado"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button 
              size="lg" 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={onAddToCart}
              disabled={!isAvailable}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Agregar al carrito
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={onAddToFavorites}
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="w-4 h-4" />
            <span>Envío gratis</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>Garantía</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RotateCcw className="w-4 h-4" />
            <span>Devolución</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Star className="w-4 h-4" />
            <span>Calidad premium</span>
          </div>
        </div>

        {/* Información del producto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>ID del producto:</span>
                <span className="font-mono">{product.id_producto}</span>
              </div>
              <div className="flex justify-between">
                <span>Categoría:</span>
                <span>{product.id_categoria}</span>
              </div>
              <div className="flex justify-between">
                <span>Línea:</span>
                <span>{product.id_linea}</span>
              </div>
              <div className="flex justify-between">
                <span>Sublínea:</span>
                <span>{product.id_sublinea}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
