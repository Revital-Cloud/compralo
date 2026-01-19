'use client';

import React from 'react';
import { Button } from "@/components/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

interface ProductCreateHeaderProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export const ProductCreateHeader: React.FC<ProductCreateHeaderProps> = ({
  title = "Crear Nuevo Producto",
  description = "Agrega un nuevo producto a tu catálogo",
  showBackButton = true,
  backUrl = "/admin/products"
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">
          Inicio &gt; Todos los Productos &gt; {title}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      {showBackButton && (
        <Link href={backUrl}>
          <Button variant="outline" className="flex items-center gap-2">
            <IconArrowLeft className="h-4 w-4" />
            Volver a Productos
          </Button>
        </Link>
      )}
    </div>
  );
};
