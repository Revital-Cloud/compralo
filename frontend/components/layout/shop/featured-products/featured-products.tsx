"use client"

import { motion } from "framer-motion"
import { ShoppingCart, Star, Heart, Eye } from "lucide-react"
import { useFeaturedProducts } from "@/hooks/use-products"
import { formatPrice } from "@/utils/format-price"
import Image from "next/image"

const FeaturedProducts = () => {
  const { 
    data: products = [], 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useFeaturedProducts()

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants = {
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
  }

  const imageVariants = {
    rest: { 
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.3 }
    }
  }

  const buttonVariants = {
    rest: { 
      scale: 1,
      y: 0
    },
    hover: { 
      scale: 1.05,
      y: -2,
      transition: { duration: 0.2 }
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
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
      <section className="relative py-20 bg-gradient-to-br from-red-50 via-white to-red-100 overflow-hidden flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Ups! Algo salió mal
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {error?.message || 'Error al cargar los productos'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Intentar de nuevo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-[#ec2538]/10 to-[#fec806]/10 rounded-full blur-3xl"
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
          className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#FF8C00]/10 to-[#ec2538]/10 rounded-full blur-3xl"
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
          className="absolute top-20 left-1/4 w-4 h-4 bg-[#FF8C00]/30 rounded-full"
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
          className="absolute top-40 right-1/4 w-3 h-3 bg-[#ec2538]/30 rounded-full"
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
            className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
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
            className="text-xl text-gray-600 max-w-2xl mx-auto"
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
          {products.map((product) => (
            <motion.div
              key={product.id_producto}
              variants={cardVariants}
              whileHover={{ 
                y: -8,
                transition: { duration: 0.3 }
              }}
              className="group relative"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200/50 overflow-hidden">
                {/* Product Image */}
                <div className="relative overflow-hidden">
                  <motion.div 
                    className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                    variants={imageVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    {product.img_producto ? (
                      <Image 
                        src={product.img_producto} 
                        alt={product.nom_producto}
                        className="w-full h-full object-cover"
                        width={300}
                        height={300}
                      />
                    ) : (
                      <div className="w-32 h-24 bg-gray-400 rounded flex items-center justify-center">
                        <div className="w-16 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded"></div>
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Quick Actions Overlay */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                    </motion.button>
                  </div>
                  
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
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#ec2538] transition-colors">
                      {product.nom_producto}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.spcf_producto.descripcion || 'Descripción del producto disponible'}
                    </p>
                  </div>

                  {/* Price and Rating */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-[#ec2538]">
                        {formatPrice(product.val_precio)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-[#fec806] text-[#fec806]" />
                      <span className="text-sm text-gray-600">4.8</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <motion.button
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      className="w-full bg-gradient-to-r from-[#FF8C00] to-[#fec806] hover:from-[#E67E00] hover:to-[#E6B800] text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Agregar al Carrito</span>
                    </motion.button>
                    
                    <motion.button
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      className="w-full border-2 border-[#ec2538] text-[#ec2538] hover:bg-[#ec2538] hover:text-white font-medium py-2 rounded-lg transition-all duration-300"
                    >
                      Ver Detalles
                    </motion.button>
                  </div>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ec2538]/5 to-[#fec806]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
            className="bg-gradient-to-r from-[#ec2538] to-[#FF8C00] text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
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
