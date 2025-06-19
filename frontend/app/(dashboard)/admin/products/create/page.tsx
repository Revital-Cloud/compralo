'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  IconUpload,
  IconX,
  IconCheck,
  IconCamera
} from "@tabler/icons-react"
import Link from "next/link"

const ProductCreatePage = () => {
  const [productData, setProductData] = useState({
    name: 'Adidas Ultra boost',
    description: 'Las carreras de larga distancia requieren mucho de los atletas.',
    category: 'Zapatillas',
    brand: 'Adidas',
    sku: '#37453',
    stockQuantity: '21',
    regularPrice: '$110.40',
    salePrice: '$450',
    tags: ['Adidas', 'Calzado', 'Zapatillas', 'Ultra boost']
  })

  const [images, setImages] = useState([
    { id: 1, name: 'Miniatura del producto.png', uploaded: true },
    { id: 2, name: 'Miniatura del producto.png', uploaded: true },
    { id: 3, name: 'Miniatura del producto.png', uploaded: true },
    { id: 4, name: 'Miniatura del producto.png', uploaded: true }
  ])

  const handleInputChange = (field: string, value: string) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const removeTag = (tagToRemove: string) => {
    setProductData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const removeImage = (imageId: number) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Detalles del Producto</h1>
          <p className="text-muted-foreground">
            Inicio &gt; Todos los Productos &gt; Detalles del Producto
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardContent className="p-6 space-y-4">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="productName">Nombre del Producto</Label>
                <Input
                  id="productName"
                  value={productData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ingresa el nombre del producto"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  value={productData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa la descripción del producto"
                />
              </div>

              {/* Category and Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    value={productData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Ingresa la categoría"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Nombre de Marca</Label>
                  <Input
                    id="brand"
                    value={productData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Ingresa el nombre de la marca"
                  />
                </div>
              </div>

              {/* SKU and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={productData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Ingresa el SKU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Cantidad en Stock</Label>
                  <Input
                    id="stockQuantity"
                    value={productData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                    placeholder="Ingresa la cantidad en stock"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regularPrice">Precio Regular</Label>
                  <Input
                    id="regularPrice"
                    value={productData.regularPrice}
                    onChange={(e) => handleInputChange('regularPrice', e.target.value)}
                    placeholder="Ingresa el precio regular"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Oferta</Label>
                  <Input
                    id="salePrice"
                    value={productData.salePrice}
                    onChange={(e) => handleInputChange('salePrice', e.target.value)}
                    placeholder="Ingresa el precio de oferta"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Etiquetas</Label>
                <div className="flex flex-wrap gap-2">
                  {productData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <IconX className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Image and Gallery */}
        <div className="xl:col-span-1 space-y-6">
          {/* Main Product Image */}
          <Card>
            <CardContent className="p-6">
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <IconCamera className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Galería del Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <IconUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Arrastra tus imágenes aquí, o navega</p>
                <p className="text-xs text-gray-400">jpeg, png están permitidos</p>
              </div>

              {/* Image List */}
              <div className="space-y-2">
                {images.map((image) => (
                  <div key={image.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <span className="text-sm">{image.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {image.uploaded && (
                        <IconCheck className="h-4 w-4 text-green-500" />
                      )}
                      <button
                        onClick={() => removeImage(image.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t">
        <Link href="/admin/products">
          <Button variant="outline">
            CANCELAR
          </Button>
        </Link>
        <Button variant="destructive">
          ELIMINAR
        </Button>
        <Button className="bg-black hover:bg-gray-800 text-white">
          ACTUALIZAR
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 mt-8">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>© 2024 - Synkro Dashboard</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-gray-900">Acerca de</a>
            <a href="#" className="hover:text-gray-900">Carreras</a>
            <a href="#" className="hover:text-gray-900">Política</a>
            <a href="#" className="hover:text-gray-900">Contacto</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCreatePage 