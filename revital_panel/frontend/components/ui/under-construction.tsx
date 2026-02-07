"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"
import { Construction, ArrowRight, Home, ArrowLeft, Sparkles, Zap, Rocket } from "lucide-react"
import Link from "next/link"

interface UnderConstructionProps {
  title?: string
  description?: string
  estimatedDate?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  className?: string
}

const FloatingParticle = ({ delay = 0 }) => (
  <motion.div
    className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
    animate={{
      y: [-20, -100],
      x: [0, Math.random() * 100 - 50],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      delay,
      ease: "easeOut",
    }}
  />
)

export function UnderConstruction({
  title = "EN CONSTRUCCIÓN",
  description = "Estamos trabajando duro para traerte una experiencia increíble. Mientras tanto, explora nuestros productos y mantente al día con las últimas novedades.",
  estimatedDate = "Próximamente Disponible",
  showBackButton = true,
  showHomeButton = true,
  className = ""
}: UnderConstructionProps) {

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 relative overflow-hidden ${className}`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.2} />
        ))}
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03]" />

      <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <Construction className="w-20 h-20 text-orange-500 mx-auto" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 text-balance"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty"
          >
            {description}
          </motion.p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-12"
        >
          <Card className="bg-orange-100/50 border-orange-200 backdrop-blur-sm">
            <CardContent className="flex items-center gap-4 p-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="bg-orange-500 p-3 rounded-full"
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-orange-800">{estimatedDate}</h3>
                <p className="text-orange-700 text-sm">Nuevas funcionalidades en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mb-16"
        >
          <Button
            asChild
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <Link href="/productos">
              <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Explorar Productos
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="flex gap-6"
        >
          {showHomeButton && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2 px-6 py-3 rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors bg-transparent"
              >
                <Link href="/">
                  <Home className="w-4 h-4" />
                  Ir al Inicio
                </Link>
              </Button>
            </motion.div>
          )}

          {showBackButton && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-6 py-3 rounded-full border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver Atrás
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}