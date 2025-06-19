import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  IconPlus,
  IconDotsVertical,
  IconShoppingCart,
  IconPackage,
  IconTrendingUp
} from "@tabler/icons-react"
import Link from "next/link"

// Mock data para productos
const productsData = [
  {
    id: 1,
    name: "Adidas Ultra boost",
    category: "Zapatillas",
    price: 110.40,
    image: "/products/adidas-1.jpg",
    summary: "Las carreras de larga distancia requieren mucho de los atletas.",
    sales: 1269,
    remainingProducts: 1269
  },
  {
    id: 2,
    name: "Adidas Ultra boost",
    category: "Zapatillas", 
    price: 500.40,
    image: "/products/adidas-2.jpg",
    summary: "Las carreras de larga distancia requieren mucho de los atletas.",
    sales: 1269,
    remainingProducts: 1269
  },
  {
    id: 3,
    name: "Adidas Ultra boost",
    category: "Zapatillas",
    price: 600.40,
    image: "/products/adidas-3.jpg",
    summary: "Las carreras de larga distancia requieren mucho de los atletas.",
    sales: 1269,
    remainingProducts: 1269
  },
  {
    id: 4,
    name: "ADIZERO SL RUNNING",
    category: "Running",
    price: 64.40,
    image: "/products/adidas-4.jpg",
    summary: "Las carreras de larga distancia requieren mucho de los atletas.",
    sales: 1269,
    remainingProducts: 1269
  },
  {
    id: 5,
    name: "ULTRABOOST CLEATS",
    category: "Zapatillas",
    price: 800.40,
    image: "/products/adidas-5.jpg",
    summary: "Las carreras de larga distancia requieren mucho de los atletas.",
    sales: 1269,
    remainingProducts: 1269
  },
  {
    id: 6,
    name: "FORUM EXHIBIT LOW",
    category: "Zapatillas",
    price: 74.00,
    image: "/products/adidas-6.jpg",
    summary: "Las carreras de larga distancia requieren mucho de los atletas.",
    sales: 109,
    remainingProducts: 1500
  }
]

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
        <Link href="/admin/products/create">
          <Button className="bg-black hover:bg-gray-800 text-white">
            <IconPlus className="h-4 w-4 mr-2" />
            AGREGAR NUEVO PRODUCTO
          </Button>
        </Link>
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