"use client"

import React, { useState, useEffect } from 'react'
import { useFavorites } from '@/hooks/use-favorites'
import { useAuth } from '@/hooks/use-auth'
import { useCart } from '@/hooks/use-cart'
import { Button } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import { Badge } from "@/components/ui"
import { Heart, ShoppingCart, ArrowLeft, Trash2, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/utils/format-price'
import { getProductImageUrl } from '@/utils/image-helpers'
import { cn } from '@/lib/utils'
import { EmptyState } from "@/components/ui"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const FavoritesPage: React.FC = () => {
  const { user } = useAuth()
  const { favorites, isLoading, removeFromFavorites, toggleFavorite } = useFavorites()
  const { addToCart } = useCart()
  const router = useRouter()
  
  // Estado local para controlar el loading de cada botón individualmente
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set())

  // Si no hay usuario autenticado, redirigir al login (usando useEffect para evitar error de React)
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Si no hay usuario, no renderizar nada mientras se redirige
  if (!user) {
    return null
  }

  const handleRemoveFromFavorites = async (
    id_categoria_producto: number,
    id_linea_producto: number,
    id_sublinea_producto: number,
    id_producto: number
  ) => {
    await removeFromFavorites(
      id_categoria_producto,
      id_linea_producto,
      id_sublinea_producto,
      id_producto
    )
  }

  const handleAddToCart = async (product: any) => {
    // Crear un ID único para este producto
    const productKey = `${product.id_categoria_producto}-${product.id_linea_producto}-${product.id_sublinea_producto}-${product.id_producto}`
    
    try {
      // Marcar este producto como cargando
      setLoadingProducts(prev => new Set(prev).add(productKey))
      
      const cartProduct = {
        id_categoria_producto: product.id_categoria_producto,
        id_linea_producto: product.id_linea_producto,
        id_sublinea_producto: product.id_sublinea_producto,
        id_producto: product.id_producto,
        cantidad: 1,
        precio_unitario_carrito: product.val_precio,
      }

      await addToCart(cartProduct)
      
      toast.success('¡Producto agregado al carrito!', {
        description: `${product.nom_producto} se ha agregado correctamente`,
        duration: 3000,
      })
    } catch (error: any) {
      console.error('Error al agregar al carrito:', error)
      toast.error('Error al agregar al carrito', {
        description: error.message || 'No se pudo agregar el producto al carrito',
        duration: 4000,
      })
    } finally {
      // Quitar el loading de este producto específico
      setLoadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productKey)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mis Favoritos
            </h1>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Mis Favoritos
            </h1>
          </div>
          
          <EmptyState
            icon={<Heart className="w-16 h-16 text-gray-400" />}
            title="No tienes favoritos aún"
            description="Explora nuestros productos y agrega tus favoritos haciendo clic en el corazón"
            action={{
              label: "Explorar Productos",
              onClick: () => router.push('/products')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mis Favoritos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'} guardados
              </p>
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <Card key={`${product.id_categoria_producto}-${product.id_linea_producto}-${product.id_sublinea_producto}-${product.id_producto}`} className="group hover:shadow-lg transition-all duration-300">
              <div className="relative">
                <Link
                  href={`/products/${product.id_categoria_producto}-${product.id_linea_producto}-${product.id_sublinea_producto}-${product.id_producto}`}
                >
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden rounded-t-lg">
                    <Image
                      src={getProductImageUrl(product.img_producto)}
                      alt={product.nom_producto}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </Link>
                
                {/* Botón de eliminar de favoritos */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={() => handleRemoveFromFavorites(
                    product.id_categoria_producto,
                    product.id_linea_producto,
                    product.id_sublinea_producto,
                    product.id_producto
                  )}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {product.nom_producto}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(product.val_precio)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      disabled={loadingProducts.has(`${product.id_categoria_producto}-${product.id_linea_producto}-${product.id_sublinea_producto}-${product.id_producto}`)}
                      className={cn(
                        "flex-1 bg-black text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-300",
                        loadingProducts.has(`${product.id_categoria_producto}-${product.id_linea_producto}-${product.id_sublinea_producto}-${product.id_producto}`) && "scale-95 bg-green-600 dark:bg-green-600"
                      )}
                      onClick={() => handleAddToCart(product)}
                    >
                      {loadingProducts.has(`${product.id_categoria_producto}-${product.id_linea_producto}-${product.id_sublinea_producto}-${product.id_producto}`) ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          ¡Agregado!
                        </motion.div>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Agregar
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => handleRemoveFromFavorites(
                        product.id_categoria_producto,
                        product.id_linea_producto,
                        product.id_sublinea_producto,
                        product.id_producto
                      )}
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FavoritesPage
