"use client"

import { motion } from "framer-motion"
import { ShoppingCart, Star, Eye } from "lucide-react"
import { useFilterProducts } from "@/hooks/use-products"
import { formatPrice } from "@/utils/format-price"
import { getProductImageUrl } from "@/utils/image-helpers"
import { getProductDescription } from "@/utils/product-helpers"
import Image from "next/image"
import type { ProductFiltered } from "@/types/product"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useActiveDiscounts } from "@/hooks/use-discounts"
import {
  getApplicableDiscount,
  calculateDiscountedPrice,
  calculateDiscountPercentage,
} from "@/utils/discount-utils"
import type { Discount } from "@/types/discount"
import { Badge } from "@/components/ui"

function renderPrice(product: ProductFiltered, activeDiscounts?: Discount[]) {
  const applicableDiscount = activeDiscounts
    ? getApplicableDiscount(product, activeDiscounts)
    : null

  const priceMin = Number(product.price_min ?? 0)
  const rawPriceMax = product.price_max
  const priceMax =
    rawPriceMax != null ? Number(rawPriceMax) || priceMin : priceMin

  const showPriceRange =
    !Number.isNaN(priceMin) && !Number.isNaN(priceMax) && priceMin !== priceMax

  const originalPrice = priceMin
  const discountedPrice =
    applicableDiscount != null
      ? calculateDiscountedPrice(originalPrice, applicableDiscount)
      : originalPrice
  const hasDiscount =
    applicableDiscount != null && discountedPrice < originalPrice
  const discountPercentage = hasDiscount
    ? calculateDiscountPercentage(originalPrice, discountedPrice)
    : 0

  const rangeDiscountedMin =
    showPriceRange && applicableDiscount
      ? calculateDiscountedPrice(priceMin, applicableDiscount)
      : priceMin
  const rangeDiscountedMax =
    showPriceRange && applicableDiscount
      ? calculateDiscountedPrice(priceMax, applicableDiscount)
      : priceMax
  const rangeHasDiscount =
    showPriceRange &&
    applicableDiscount != null &&
    (rangeDiscountedMin < priceMin || rangeDiscountedMax < priceMax)

  if (showPriceRange) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xl text-[#ec2538] dark:text-red-400">
            {formatPrice(rangeHasDiscount ? rangeDiscountedMin : priceMin)}
            <span className="mx-1 font-normal text-gray-500 dark:text-gray-400">
              –
            </span>
            {formatPrice(rangeHasDiscount ? rangeDiscountedMax : priceMax)}
          </span>
          {rangeHasDiscount && (
            <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        {rangeHasDiscount && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 line-through">
            {formatPrice(priceMin)} – {formatPrice(priceMax)}
          </span>
        )}
      </div>
    )
  }

  if (hasDiscount) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-xl text-[#ec2538] dark:text-red-400">
            {formatPrice(discountedPrice)}
          </span>
          <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
            -{discountPercentage}%
          </Badge>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 line-through">
          {formatPrice(originalPrice)}
        </span>
      </div>
    )
  }

  return (
    <span className="font-bold text-xl text-[#ec2538] dark:text-red-400">
      {formatPrice(discountedPrice)}
    </span>
  )
}

const FeaturedProducts = () => {
  const router = useRouter()
  const { data: activeDiscounts } = useActiveDiscounts()

  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
    isError,
  } = useFilterProducts(
    {
      limit: 8,
      ordenar_por: "fecha",
      orden: "DESC",
      solo_con_stock: false,
    },
    { enabled: true },
  )

  const products: ProductFiltered[] = productsResponse?.products ?? []

  // Función para navegar a detalles del producto por slug o id
  const handleViewDetails = (product: ProductFiltered) => {
    const path = product.slug ?? product.id
    router.push(`/products/${path}`)
  }

  // Función para manejar el botón "Ver Todos los Productos"
  const handleViewAllProducts = () => {
    router.push('/products')
  }

  // Animation variants - memoized to prevent re-creation on each render
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }), [])

  const cardVariants = useMemo(() => ({
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  }), [])

  const imageVariants = useMemo(() => ({
    rest: { 
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.3 }
    }
  }), [])

  const buttonVariants = useMemo(() => ({
    rest: { 
      scale: 1,
      y: 0
    },
    hover: { 
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2 }
    }
  }), [])

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-gray-900/25 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-colors duration-300 flex flex-col h-full min-h-[500px]"
              >
                <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex-grow mb-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4 animate-pulse" />
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-4 animate-pulse flex-shrink-0" />
                  <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded animate-pulse flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Error state
  if (isError) {
    return (
      <section className="relative py-20 bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-red-950/20 dark:via-gray-900 dark:to-red-950/20 overflow-hidden flex items-center justify-center transition-colors duration-300">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            ¡Ups! Algo salió mal
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto transition-colors duration-300">
            {error?.message || 'Error al cargar los productos'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-6 py-3 bg-red-500 dark:bg-red-600 text-white rounded-lg font-medium hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-300"
          >
            <Eye className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="productos" className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-[#ec2538]/10 to-[#fec806]/10 dark:from-[#ec2538]/20 dark:to-[#fec806]/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#FF8C00]/10 to-[#ec2538]/10 dark:from-[#FF8C00]/20 dark:to-[#ec2538]/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Floating elements */}
        <motion.div 
          className="absolute top-20 left-1/4 w-4 h-4 bg-[#FF8C00]/30 dark:bg-[#FF8C00]/50 rounded-full"
          animate={{
            y: [0, -10, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-40 right-1/4 w-3 h-3 bg-[#ec2538]/30 dark:bg-[#ec2538]/50 rounded-full"
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Productos{" "}
            <span className="bg-gradient-to-r from-[#FF8C00] to-[#fec806] bg-clip-text text-transparent">
              Destacados
            </span>
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Descubre nuestra selección de productos más populares con las mejores ofertas
          </motion.p>
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {products
            .slice(0, 4)
            .map((product: ProductFiltered) => (
            <motion.div
              key={product.slug ?? String(product.id)}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
              className="group relative h-full"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-gray-900/25 hover:shadow-2xl dark:hover:shadow-gray-900/40 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden flex flex-col h-full min-h-[500px]">
                {/* Product Image */}
                <div className="relative overflow-hidden flex-shrink-0">
                  <motion.div 
                    className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center cursor-pointer"
                    variants={imageVariants}
                    initial="rest"
                    whileHover="hover"
                    onClick={() => handleViewDetails(product)}
                  >
                    <Image 
                      src={getProductImageUrl(product.image_url)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      width={300}
                      height={300}
                    />
                  </motion.div>
                  
                  {/* Discount Badge - Temporarily disabled until Product type is defined */}
                  {/* {product.descuento && product.descuento > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#ec2538] text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{product.descuento}%
                      </span>
                    </div>
                  )} */}
                </div>

                {/* Product Info */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="mb-4 flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#ec2538] dark:group-hover:text-red-400 transition-colors duration-300">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 transition-colors duration-300">
                      {getProductDescription(undefined, product.description ?? "Descripción del producto disponible")}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-3 flex-shrink-0">
                    <div className="min-h-[2.5rem] flex flex-col justify-start">
                      {renderPrice(product, activeDiscounts as Discount[] | undefined)}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-[#fec806] text-[#fec806]" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      {product.rating && product.rating > 0 ? product.rating.toFixed(1) : "0.0"}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 flex-shrink-0">
                    <motion.button
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      onClick={() => handleViewDetails(product)}
                      className="w-full border-2 border-[#ec2538] dark:border-red-400 text-[#ec2538] dark:text-red-400 hover:bg-[#ec2538] dark:hover:bg-red-400 hover:!text-white dark:hover:!text-white font-medium py-2 rounded-lg transition-all duration-300 cursor-pointer"
                    >
                      Ver Detalles
                    </motion.button>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ec2538]/5 to-[#fec806]/5 dark:from-[#ec2538]/10 dark:to-[#fec806]/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.button 
            onClick={handleViewAllProducts}
            className="bg-gradient-to-r from-[#ec2538] to-[#FF8C00] text-white font-bold py-4 px-8 rounded-xl shadow-lg dark:shadow-gray-900/25 hover:shadow-xl transition-all duration-300 text-lg cursor-pointer"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(236, 37, 56, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            Ver Todos los Productos
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedProducts
