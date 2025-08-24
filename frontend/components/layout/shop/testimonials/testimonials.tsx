"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  rating: number
  avatar: string
  bgColor: string
}

const TestimonialsSection = () => {
  // Static testimonials data - later can be fetched from API
  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "María González",
      role: "Cliente frecuente",
      content: "Compralo ha transformado mi experiencia de compras online. Los productos llegan rápido y la calidad es excepcional. ¡Totalmente recomendado!",
      rating: 5,
      avatar: "MG",
      bgColor: "from-[#ec2538] to-[#FF8C00]"
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      role: "Empresario",
      content: "La variedad de productos es increíble y los precios son muy competitivos. El servicio al cliente es de primera clase.",
      rating: 5,
      avatar: "CR",
      bgColor: "from-[#FF8C00] to-[#fec806]"
    },
    {
      id: 3,
      name: "Ana Martínez",
      role: "Mamá emprendedora",
      content: "Me encanta la facilidad para encontrar todo lo que necesito en un solo lugar. Las ofertas son reales y los descuentos increíbles.",
      rating: 5,
      avatar: "AM",
      bgColor: "from-[#fec806] to-[#ec2538]"
    }
  ]

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const quoteVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      rotate: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.3
      }
    }
  }

  const starVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0
    },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: 0.5 + i * 0.1,
        ease: "easeOut"
      }
    })
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        variants={starVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        custom={i}
      >
        <Star 
          className={`w-5 h-5 ${i < rating ? 'fill-[#fec806] text-[#fec806]' : 'text-gray-300 dark:text-gray-600'}`}
        />
      </motion.div>
    ))
  }

  return (
    <section className="relative py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-br from-[#ec2538]/10 to-[#FF8C00]/10 dark:from-[#ec2538]/20 dark:to-[#FF8C00]/20 rounded-full blur-3xl"
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
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-[#fec806]/10 to-[#ec2538]/10 dark:from-[#fec806]/20 dark:to-[#ec2538]/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Floating quote decorations */}
        <motion.div
          className="absolute top-20 left-1/4 text-[#ec2538]/20 dark:text-[#ec2538]/30"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Quote className="w-16 h-16" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-1/4 text-[#fec806]/20 dark:text-[#fec806]/30"
          animate={{
            y: [0, -15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Quote className="w-12 h-12 rotate-180" />
        </motion.div>
      </div>

      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold mb-4"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-[#ec2538] dark:text-red-400">Testimonios</span>
            <br />
            <span className="bg-gradient-to-r from-[#FF8C00] to-[#fec806] bg-clip-text text-transparent">
              de nuestros clientes
            </span>
          </motion.h2>
          <motion.p 
            className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto transition-colors duration-300"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            Descubre por qué miles de colombianos confían en nosotros para sus compras online
          </motion.p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ 
                y: -10,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg dark:shadow-gray-900/25 hover:shadow-2xl dark:hover:shadow-gray-900/40 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 h-full">
                {/* Quote icon */}
                <motion.div
                  variants={quoteVariants}
                  className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-[#ec2538] to-[#FF8C00] rounded-full flex items-center justify-center shadow-lg dark:shadow-gray-900/25"
                >
                  <Quote className="w-4 h-4 text-white" />
                </motion.div>
                
                {/* Content */}
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed italic text-sm lg:text-base transition-colors duration-300">
                    "{testimonial.content}"
                  </p>
                </div>
                
                {/* Rating */}
                <motion.div 
                  className="flex space-x-1 mb-4"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {renderStars(testimonial.rating)}
                </motion.div>
                
                {/* User info */}
                <div className="flex items-center space-x-3">
                  <motion.div 
                    className={`w-12 h-12 bg-gradient-to-br ${testimonial.bgColor} rounded-full flex items-center justify-center text-white font-bold shadow-lg dark:shadow-gray-900/25`}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5,
                      transition: { duration: 0.3 }
                    }}
                  >
                    {testimonial.avatar}
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm lg:text-base transition-colors duration-300">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-xs lg:text-sm transition-colors duration-300">
                      {testimonial.role}
                    </p>
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
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
        >
          <motion.p 
            className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-300"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
          >
            ¿Quieres ser parte de nuestros clientes satisfechos?
          </motion.p>
          <motion.button
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#ec2538] to-[#FF8C00] text-white font-semibold rounded-full hover:shadow-lg dark:hover:shadow-gray-900/25 transition-all duration-300"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            Empezar a comprar
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

export default TestimonialsSection
