'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface ProductsHeaderProps { }

export const ProductsHeader: React.FC<ProductsHeaderProps> = () => {

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Todos los Productos</h1>
        <Breadcrumb 
          items={[{ label: 'Inicio', href: '/admin' }, { label: 'Todos los Productos', href: '/admin/products' }]}
          className="text-sm text-gray-500"
        >
        </Breadcrumb>
      </div>
      
      <div className="flex gap-3">
        
        {/* Botón de Agregar */}
        <Link href="/admin/products/create">
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground">
            <IconPlus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </Link>
      </div>
    </div>
  );
};
