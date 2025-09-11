'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IconPlus, IconUpload, IconDownload } from "@tabler/icons-react";
import Link from "next/link";
import { ImportWizard } from "@/components/excel";
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface ProductsHeaderProps {
  onImportComplete: (result: any) => void;
  onExport?: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({ 
  onImportComplete, 
  onExport 
}) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleImportComplete = (result: any) => {
    onImportComplete(result);
    setImportDialogOpen(false);
  };

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
        {/* Botón de Exportar */}
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar Productos
          </Button>
        )}
        
        {/* Botón de Importar */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <IconUpload className="h-4 w-4 mr-2" />
              Importar Productos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Importar Productos desde Excel/CSV</DialogTitle>
            </DialogHeader>
            <ImportWizard
              title="Importar Productos"
              description="Sube un archivo Excel o CSV con los datos de tus productos para agregarlos masivamente"
              templateType="products"
              requiredFields={['nombre', 'precio', 'stock', 'categoria']}
              onImportComplete={handleImportComplete}
              onCancel={() => setImportDialogOpen(false)}
              className="border-0 shadow-none"
            />
          </DialogContent>
        </Dialog>
        
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
