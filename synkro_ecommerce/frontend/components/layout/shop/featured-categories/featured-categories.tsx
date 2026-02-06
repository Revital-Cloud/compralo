"use client"

import { motion } from "framer-motion"
import { useFeaturedCategories } from "@/hooks/use-categories"
import { getIconComponent } from "@/utils/category-mapper"
import { useRouter } from "next/navigation"
import Link from "next/link"
import FeaturedCategoriesSkeleton from "./featured-categories-skeleton"
import FeaturedCategoriesError from "./featured-categories-error"

const MotionLink = motion(Link)

const FeaturedCategories = () => {
  const router = useRouter()
  const { 
    data: categories = [], 
    isLoading, 
    error, 
    refetch,
    isError 
  } = useFeaturedCategories()

  // Función para navegar a la categoría
  const handleCategoryClick = (categoryId: string) => {
    router.push(`/categories/${categoryId}`)
  }

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

  const iconVariants = {
    rest: { 
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: 1.2,
      rotate: 10,
      transition: { duration: 0.3 }
    }
  }

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <FeaturedCategoriesSkeleton />
    )
  }

  // Error state
  if (isError) {
    return (
      <FeaturedCategoriesError error={error} refetch={refetch} />
    )
  }

  return (
    <section id="categorias" className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-20 -right-20 w-60 h-60 bg-linear-to-br from-[#FF8C00]/10 to-[#fec806]/10 dark:from-[#FF8C00]/20 dark:to-[#fec806]/20 rounded-full blur-3xl"
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
          className="absolute -bottom-20 -left-20 w-60 h-60 bg-linear-to-br from-[#ec2538]/10 to-[#FF8C00]/10 dark:from-[#ec2538]/20 dark:to-[#FF8C00]/20 rounded-full blur-3xl"
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
        
        {/* Floating geometric shapes */}
        <motion.div 
          className="absolute top-20 left-1/4 w-4 h-4 bg-[#FF8C00]/30 dark:bg-[#FF8C00]/50 rounded-full"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div 
          className="absolute top-40 right-1/4 w-3 h-3 bg-[#ec2538]/30 dark:bg-[#ec2538]/50 rounded-full"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-40 left-1/3 w-5 h-5 bg-[#fec806]/30 dark:bg-[#fec806]/50 rounded-full"
          variants={floatingVariants}
          animate="animate"
          transition={{ delay: 2 }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Explora Nuestras{" "}
            <span className="bg-linear-to-br from-[#FF8C00] to-[#fec806] bg-clip-text text-transparent">
              Categorías
            </span>
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Descubre productos increíbles en cada categoría, diseñados especialmente para ti
          </motion.p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-8 animate-pulse transition-colors duration-300">
                <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 mx-auto w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mx-auto w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 text-lg transition-colors duration-300">{error}</p>
          </div>
        )}

        {/* Categories Grid */}
        {!isLoading && !error && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {categories.map((category, index) => {
              const IconComponent = getIconComponent(category.icon)
              
              return (
                <motion.div
                  key={category.id}
                  variants={cardVariants}
                  whileHover="hover"
                  initial="rest"
                  className="group relative"
                >
                  <motion.div 
                    className={`relative bg-linear-to-br ${category.bgGradient} rounded-2xl p-8 text-center cursor-pointer overflow-hidden shadow-lg dark:shadow-gray-900/25`}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white rounded-full -translate-y-10 translate-x-10" />
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white rounded-full translate-y-8 -translate-x-8" />
                    </div>

                    {/* Icon container */}
                    <motion.div 
                      className={`w-20 h-20 ${category.iconBg} rounded-full flex items-center justify-center mx-auto mb-6 relative z-10`}
                      variants={iconVariants}
                    >
                      <IconComponent 
                        className="w-10 h-10" 
                        style={{ color: category.color }}
                      />
                    </motion.div>

                    {/* Content */}
                    <div className="relative z-10">
                      <motion.h3 
                        className="text-white font-bold text-xl mb-2"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        {category.name}
                      </motion.h3>
                      <motion.p 
                        className="text-white/90 text-sm"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {category.description}
                      </motion.p>
                    </div>

                    {/* Hover effect overlay */}
                    <motion.div 
                      className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={{ scale: 0.8 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Floating elements on hover */}
                    <motion.div 
                      className="absolute top-4 right-4 w-2 h-2 bg-white/40 rounded-full opacity-0 group-hover:opacity-100"
                      whileHover={{
                        scale: [1, 1.5, 1],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        delay: 0.5
                      }}
                    />
                    <motion.div 
                      className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-white/40 rounded-full opacity-0 group-hover:opacity-100"
                      whileHover={{
                        scale: [1, 1.5, 1],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        delay: 1
                      }}
                    />
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Call to action */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <MotionLink
            href="/categories"
            className="inline-flex items-center justify-center min-h-12 min-w-12 bg-linear-to-br from-[#ec2538] to-[#FF8C00] text-white font-bold py-4 px-8 rounded-xl shadow-lg dark:shadow-gray-900/25 hover:shadow-xl transition-all duration-300 text-lg cursor-pointer"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(236, 37, 56, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            Ver Todas las Categorías
          </MotionLink>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedCategories
