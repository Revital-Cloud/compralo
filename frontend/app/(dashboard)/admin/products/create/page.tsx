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
    description: 'Long distance running requires a lot from athletes.',
    category: 'Sneaker',
    brand: 'Adidas',
    sku: '#37453',
    stockQuantity: '21',
    regularPrice: '$110.40',
    salePrice: '$450',
    tags: ['Adidas', 'Shoes', 'Sneakers', 'Ultra boost']
  })

  const [images, setImages] = useState([
    { id: 1, name: 'Product thumbnail.png', uploaded: true },
    { id: 2, name: 'Product thumbnail.png', uploaded: true },
    { id: 3, name: 'Product thumbnail.png', uploaded: true },
    { id: 4, name: 'Product thumbnail.png', uploaded: true }
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
          <h1 className="text-2xl font-bold">Product Details</h1>
          <p className="text-muted-foreground">
            Home &gt; All Products &gt; Product Details
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
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={productData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product description"
                />
              </div>

              {/* Category and Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={productData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Enter category"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand Name</Label>
                  <Input
                    id="brand"
                    value={productData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="Enter brand name"
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
                    placeholder="Enter SKU"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    value={productData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                    placeholder="Enter stock quantity"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regularPrice">Regular Price</Label>
                  <Input
                    id="regularPrice"
                    value={productData.regularPrice}
                    onChange={(e) => handleInputChange('regularPrice', e.target.value)}
                    placeholder="Enter regular price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <Input
                    id="salePrice"
                    value={productData.salePrice}
                    onChange={(e) => handleInputChange('salePrice', e.target.value)}
                    placeholder="Enter sale price"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tag</Label>
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
              <CardTitle className="text-lg">Product Gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <IconUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Drop your images here, or browse</p>
                <p className="text-xs text-gray-400">jpeg, png are allowed</p>
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
            CANCEL
          </Button>
        </Link>
        <Button variant="destructive">
          DELETE
        </Button>
        <Button className="bg-black hover:bg-gray-800 text-white">
          UPDATE
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 mt-8">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>© 2023 - Joda Dashboard</span>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-gray-900">About</a>
            <a href="#" className="hover:text-gray-900">Careers</a>
            <a href="#" className="hover:text-gray-900">Policy</a>
            <a href="#" className="hover:text-gray-900">Contact</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCreatePage 