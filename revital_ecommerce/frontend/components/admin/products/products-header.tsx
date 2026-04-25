'use client';

import React from 'react';
import { Button } from "@/components/ui";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui";
import { Loader2, RefreshCw } from "lucide-react";

interface ProductsHeaderProps {
  onReindexEmbeddings?: () => void;
  isReindexing?: boolean;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  onReindexEmbeddings,
  isReindexing = false,
}) => {

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" data-tour-id="products-header">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Todos los Productos</h1>
        <Breadcrumb 
          items={[{ label: 'Inicio', href: '/admin' }, { label: 'Todos los Productos', href: '/admin/products' }]}
          className="text-sm text-gray-500"
        >
        </Breadcrumb>
      </div>
      
      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end sm:gap-3">
        <Button
          variant="outline"
          onClick={onReindexEmbeddings}
          disabled={!onReindexEmbeddings || isReindexing}
          title="Actualizar índice de búsqueda"
          className="min-w-0 flex-1 sm:flex-none"
        >
          {isReindexing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          <span className="truncate">Actualizar índice</span>
        </Button>

        {/* Botón de Agregar */}
        <Link href="/admin/products/create" className="min-w-0 flex-1 sm:flex-none">
          <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-600">
            <IconPlus className="h-4 w-4 mr-2" />
            <span className="truncate">Agregar Producto</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
