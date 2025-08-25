'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IconPlus, IconUpload, IconDownload } from "@tabler/icons-react";
import Link from "next/link";
import { ImportWizard } from "@/components/excel";
import { toast } from "sonner";

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
        <p className="text-muted-foreground">
          Inicio &gt; Todos los Productos
        </p>
      </div>
      
      <div className="flex gap-3">
        {/* Botón de Exportar */}
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <IconDownload className="h-4 w-4 mr-2" />
            EXPORTAR
          </Button>
        )}
        
        {/* Botón de Importar */}
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <IconUpload className="h-4 w-4 mr-2" />
              IMPORTAR PRODUCTOS
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
          <Button className="bg-black hover:bg-gray-800 text-white">
            <IconPlus className="h-4 w-4 mr-2" />
            AGREGAR NUEVO PRODUCTO
          </Button>
        </Link>
      </div>
    </div>
  );
};
