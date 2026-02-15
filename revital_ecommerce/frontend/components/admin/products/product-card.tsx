'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui";
import { 
  IconDotsVertical,
  IconPackage,
  IconTrendingUp,
  IconEdit,
  IconTrash,
  IconEye,
  IconBuilding,
  IconLayersOff,
  IconBox,
  IconTruck,
  IconActivity,
  IconCircleCheck,
  IconCircleX,
  IconCalendar,
  IconTag,
  IconHeadphones,
  IconDeviceTablet,
  IconDeviceMobile,
  IconDeviceLaptop
} from "@tabler/icons-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";
import Link from "next/link";
import { Product } from "@/types/product";
import Image from "next/image";
interface ProductCardProps {
  product: Product;
  onDelete?: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const handleDelete = () => {
    if (onDelete && confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      onDelete(Number(product.id));
    }
  };

  // Función para obtener el icono de categoría
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case '1': return <IconDeviceMobile className="h-4 w-4 text-blue-500" />;
      case '2': return <IconHeadphones className="h-4 w-4 text-green-500" />;
      case '3': return <IconDeviceTablet className="h-4 w-4 text-purple-500" />;
      case '4': return <IconDeviceLaptop className="h-4 w-4 text-orange-500" />;
      default: return <IconPackage className="h-4 w-4 text-gray-500" />;
    }
  };

  // Función para obtener el nombre de categoría
  const getCategoryName = (categoryId: string) => {
    switch (categoryId) {
      case '1': return 'Smartphones';
      case '2': return 'Audio';
      case '3': return 'Tablets';
      case '4': return 'Laptops';
      default: return 'Categoría';
    }
  };

  // Función para obtener el estado de stock
  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: 'Sin Stock', variant: 'destructive' as const, color: 'text-red-600' };
    } else if (stock <= 10) {
      return { label: 'Stock Bajo', variant: 'secondary' as const, color: 'text-yellow-600' };
    } else {
      return { label: 'En Stock', variant: 'default' as const, color: 'text-green-600' };
    }
  };

  const stockStatus = getStockStatus(product.num_stock ?? product.stock_total ?? 0);

  return (
    <Card className="relative hover:shadow-lg transition-all duration-200 border-border/50 bg-card">
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{product.name ?? (product as any).nom_producto}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              ID: {product.id}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <IconDotsVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/products/${product.id}/view`}>
                  <IconEye className="h-4 w-4 mr-2" />
                  Ver detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/products/${product.id}/edit`}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <IconTrash className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 p-3 pt-2">
        {/* Imagen del producto */}
        <div className="w-full h-36 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg flex items-center justify-center overflow-hidden relative group">
          {((product as any).image_url ?? product.img_producto?.main) ? (
            <div className="relative w-full h-full">
              <Image 
                src={(product as any).image_url ?? product.img_producto?.main ?? ''}
                alt={product.name ?? (product as any).nom_producto ?? ''}
                className="w-full h-full fit-cover p-2 transition-transform duration-300 group-hover:scale-105"
                width={300}
                height={300}
                priority
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('opacity-0');
                  e.currentTarget.nextElementSibling?.classList.add('flex');
                }}
              />
              <div className="absolute inset-0 items-center justify-center opacity-0">
                <IconPackage className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <IconPackage className="h-10 w-10 text-muted-foreground/60" />
              <span className="text-xs text-muted-foreground/60">Sin imagen</span>
            </div>
          )}
          {/* Overlay sutil para mejor contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Precio */}
        <div className="text-center">
          <div className="text-base font-bold text-primary">
            $ {parseFloat(String((product as any).price_min ?? product.val_precio)).toLocaleString()}
          </div>
        </div>

        {/* Información del producto */}
        <div className="space-y-1">
          {/* Categoría */}
          <div className="flex items-center space-x-1">
            {getCategoryIcon(product.category_id)}
            <span className="text-xs font-medium">{product.category_name || getCategoryName(product.category_id)}</span>
          </div>

          {/* Línea */}
          <div className="flex items-center space-x-1">
            <IconLayersOff className="h-3 w-3 text-green-500" />
            <span className="text-xs font-medium">{(product as { category_name?: string }).category_name || '—'}</span>
          </div>

          {/* Proveedor */}
          <div className="flex items-center space-x-1">
            <IconTruck className="h-3 w-3 text-orange-500" />
            <span className="text-xs font-medium">{product.nom_proveedor ?? '—'}</span>
          </div>

          {/* Marca */}
          <div className="flex items-center space-x-1">
            <IconTag className="h-3 w-3 text-purple-500" />
            <span className="text-xs font-medium">{product.nom_marca || product.id_marca}</span>
          </div>
        </div>

        {/* Especificaciones */}
        <div className="bg-muted/50 rounded-lg p-1.5">
          <div className="flex items-center space-x-1 mb-1">
            <IconActivity className="h-3 w-3 text-indigo-500" />
            <span className="text-xs font-medium">Especificaciones</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {Object.entries((product as any).spcf_producto ?? {}).slice(0, 2).map(([key, value]) => 
              `${key}: ${Array.isArray(value) ? value.join(', ') : value}`
            ).join(' • ')}
          </p>
        </div>

        {/* Stock y fecha */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <IconBox className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Stock</span>
            </div>
            <div className={`text-sm font-semibold ${stockStatus.color}`}>
              {product.num_stock || 0}
            </div>
          </div>
          
          <div>
            <div className="flex items-center space-x-1 mb-1">
              <IconCalendar className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Creado</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {product.fec_insert ? new Date(product.fec_insert).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>

        {/* Estado de activación */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Código</span>
            <Badge variant="outline" className="text-xs">
              {product.id}
            </Badge>
          </div>
          <div className="mt-1">
            <Badge variant={stockStatus.variant} className="text-xs">
              {stockStatus.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};