'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  IconDotsVertical,
  IconPackage,
  IconTrendingUp,
  IconEdit,
  IconTrash
} from "@tabler/icons-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onDelete?: (id: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const handleDelete = () => {
    if (onDelete && confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      onDelete(product.id_producto);
    }
  };

  return (
    <Card className="relative hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {product.img_producto ? (
                <img 
                  src={product.img_producto} 
                  alt={product.nom_producto}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <IconPackage className="h-6 w-6 text-gray-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{product.nom_producto}</CardTitle>
              <CardDescription className="text-xs">{product.categoria?.nom_categoria || 'Sin categoría'}</CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/products/${product.id_producto}/edit`}>
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
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            ${product.precio_producto?.toFixed(2) || '0.00'}
          </div>
          <Badge variant={product.stock_producto > 0 ? "default" : "destructive"}>
            {product.stock_producto > 0 ? 'En Stock' : 'Sin Stock'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <h4 className="text-sm font-medium mb-1">Descripción</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.des_producto || 'Sin descripción'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Stock</p>
            <div className="flex items-center space-x-1">
              <IconTrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-sm font-medium">{product.stock_producto || 0}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Código</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">{product.cod_producto || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {product.marca && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Marca</p>
            <Badge variant="outline" className="text-xs">
              {product.marca.nom_marca}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
