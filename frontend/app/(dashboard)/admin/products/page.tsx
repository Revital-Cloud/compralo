'use client';

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  IconPlus,
  IconDotsVertical,
  IconShoppingCart,
  IconPackage,
  IconTrendingUp,
  IconUpload,
  IconDownload
} from "@tabler/icons-react"
import Link from "next/link"
import { ImportWizard } from "@/components/excel"
import { toast } from "sonner"

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  summary: string;
  sales: number;
  remainingProducts: number;
}

// Mock data para productos
const productsData: Product[] = []

// Componente para tarjeta de producto
const ProductCard = ({ product }: { product: any }) => (
  <Card className="relative">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <IconPackage className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{product.name}</CardTitle>
            <CardDescription className="text-xs">{product.category}</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <IconDotsVertical className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-lg font-bold">${product.price}</div>
    </CardHeader>
    
    <CardContent className="space-y-3">
      <div>
        <h4 className="text-sm font-medium mb-1">Resumen</h4>
        <p className="text-xs text-muted-foreground">{product.summary}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Ventas</p>
          <div className="flex items-center space-x-1">
            <IconTrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-sm font-medium">{product.sales}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Productos Restantes</p>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium">{product.remainingProducts}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Componente de paginación
const Pagination = () => (
  <div className="flex items-center justify-center space-x-2 mt-6">
    <Button variant="default" size="sm" className="w-8 h-8 p-0">1</Button>
    <Button variant="outline" size="sm" className="w-8 h-8 p-0">2</Button>
    <Button variant="outline" size="sm" className="w-8 h-8 p-0">3</Button>
    <Button variant="outline" size="sm" className="w-8 h-8 p-0">4</Button>
    <span className="px-2">...</span>
    <Button variant="outline" size="sm" className="w-8 h-8 p-0">10</Button>
    <Button variant="outline" size="sm">SIGUIENTE</Button>
  </div>
)

const ProductsPage = () => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleImportComplete = (result: any) => {
    toast.success(`¡Importación completada! ${result.successfulRows} productos agregados`);
    setImportDialogOpen(false);
    // Aquí podrías refrescar la lista de productos
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Todos los Productos</h1>
          <p className="text-muted-foreground">
            Inicio &gt; Todos los Productos
          </p>
        </div>
        <div className="flex gap-3">
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productsData.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  )
}

export default ProductsPage