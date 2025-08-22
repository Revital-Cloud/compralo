"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Star, TrendingUp, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"
import RotatingText from "@/components/ui/rotating-text"
import "@/components/ui/rotating-text.css"
import BgDecorativeElements from "./components/bg-decorative-elements"

const EcommerceHeroCarousel: React.FC = () => {
  // Animation variants for text
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  }

  const titleVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" as const }
    }
  }

  const subtitleVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.3 }
    }
  }

  const buttonVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  }

  const trustVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  }

  // Animation variants for the right section (SVG and cards)
  const cartSvgVariants = {
    hidden: { opacity: 0, scale: 0.8, x: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" as const, delay: 0.8 } // Appears after left content starts
    }
  }

  const statCardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const, delay: 1.5 + i * 0.2 } // Staggered appearance after cart
    })
  }

  // Floating particles component
  const FloatingParticles = () => {
    const [particles, setParticles] = useState<Array<{
      id: number;
      left: number;
      top: number;
      xOffset: number;
      duration: number;
      delay: number;
    }>>([]);

    useEffect(() => {
      // Generate particles only on client side to avoid hydration mismatch
      const generateParticles = () => {
        const newParticles = Array.from({ length: 15 }, (_, i) => ({
          id: i,
          left: Math.random() * 100,
          top: Math.random() * 100,
          xOffset: Math.random() * 10 - 5,
          duration: 3 + Math.random() * 4,
          delay: Math.random() * 2,
        }));
        setParticles(newParticles);
      };

      generateParticles();
    }, []);

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-1 h-1 bg-gradient-to-r from-[#ec2538]/30 via-[#FF8C00]/30 to-[#fec806]/30 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, particle.xOffset, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <section className="relative w-full min-h-[120vh] bg-gradient-to-br from-[#F5F5F5] via-white to-[#F0F0F0] overflow-hidden">
      {/* Background decorative elements */}
      <BgDecorativeElements />
      
      {/* Floating particles overlay */}
      <FloatingParticles />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 lg:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-10 lg:space-y-12">
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ec2538] to-[#FF8C00] text-white px-6 py-3 rounded-full text-base lg:text-lg font-medium"
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6" />
              <span>🔥 Ofertas en Tendencia</span>
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 
              className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
               <motion.span 
                 className="text-[#ec2538]"
                 variants={titleVariants}
                 initial="hidden"
                 animate="visible"
               >
                Descubre las
               </motion.span>
              <br />
                <RotatingText
                 texts={[
                   "mejores ofertas",
                   "ofertas únicas",
                   "ofertas increíbles",
                   "ofertas especiales",
                   "ofertas premium"
                 ]}
                 className="bg-gradient-to-r from-[#FF8C00] to-[#fec806] bg-clip-text text-secondary"
                 rotationInterval={3000}
                 staggerDuration={0.05}
                 staggerFrom="center"
                 transition={{
                   type: "spring",
                   damping: 20,
                   stiffness: 100
                 }}
                 initial={{ y: 50, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -50, opacity: 0 }}
                 auto={true}
                 loop={true}
               />
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="text-xl lg:text-2xl text-gray-600 max-w-xl leading-relaxed"
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
            >
              Descubre productos increíbles a precios imbatibles. Calidad garantizada en cada compra.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.9 }}
            >
              <Button 
                size="lg" 
                className="w-full sm:w-48 bg-gradient-to-r from-[#FF8C00] to-[#fec806] hover:from-[#E67E00] hover:to-[#E6B800] text-white font-bold py-5 text-lg lg:text-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                Comprar ahora
              </Button>
              <Button 
                variant="outline"
                size="lg" 
                className="w-full sm:w-48 border-2 border-[#ec2538] text-[#ec2538] hover:bg-[#ec2538] hover:text-white font-semibold py-5 text-lg lg:text-xl rounded-xl transition-all duration-300 flex items-center justify-center"
              >
                Ver Categorías
              </Button>
            </motion.div>
            
            {/* Trust indicators */}
            <motion.div 
              className="flex flex-wrap items-center gap-8 pt-8"
              variants={trustVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1.2 }}
            >
              <motion.div 
                className="flex items-center gap-2"
                variants={trustVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.3 }}
              >
                <Shield className="w-5 h-5 text-[#ec2538]" />
                <span className="text-sm lg:text-base text-gray-600">Compra Segura</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                variants={trustVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.4 }}
              >
                <Zap className="w-5 h-5 text-[#fec806]" />
                <span className="text-sm lg:text-base text-gray-600">Entrega Rápida</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                variants={trustVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 1.5 }}
              >
                <Star className="w-5 h-5 text-[#FF8C00]" />
                <span className="text-sm lg:text-base text-gray-600">4.9/5 Calificación</span>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Right Content - Enhanced Shopping Cart */}
          <div className="flex justify-center lg:justify-end relative">
            <div className="relative group">
              {/* Main cart with glow effect */}
              <motion.div 
                className="relative"
                variants={cartSvgVariants}
                initial="hidden"
                animate="visible"
              >
                <svg className="w-64 h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
                  <circle className="fill-[#ec2538]" cx="280.42" cy="568.76" r="43.83"/>
                  <circle className="fill-[#ec2538]" cx="495.94" cy="568.76" r="43.83"/>
                  <path className="fill-[#ec2538]" d="M53.48,164.04h82.2c3.44,0,6.42,2.37,7.2,5.73l67.48,292.67c4.66,20.22,22.67,34.55,43.42,34.55h267.95c34.64,0,64.96-23.25,73.96-56.7l57.12-212.33c4.52-16.79-8.13-33.28-25.51-33.28h-61.44c4.92,71.77-21.63,132.81-63.82,188.53,19.19,12.32,33.63,26.23,32.64,45.31,1.55,34.12-48.73,38.39-108.03,37.47h-119.7c-17.42,0-31.54-14.12-31.54-31.54v-145.6c0-22.14,23.66-36.25,43.14-25.72l27.7,14.97c23.19-21.34,40.1-48.75,49.78-83.14h-190.56c-3.24,0-6.04-2.25-6.75-5.41l-8.66-38.78c-4.94-22.13-24.58-37.87-47.26-37.87H53.47c-5.82,0-11.59,1.55-16.4,4.82-7.04,4.79-10.7,11.74-10.71,21.02-.71,10.34,3.81,17.17,11.9,21.61,4.64,2.55,9.93,3.69,15.22,3.69Z"/>
                  <path className="fill-[#fec806]" d="M441.83,75.06c-4.32,118.31-38.28,185.28-84.47,231.11-3.22,3.2-8.23,3.71-12.07,1.3l-35.57-22.4c-4.62-2.91-10.64.41-10.64,5.87v140.38c0,5.26,4.25,9.53,9.51,9.56,78.36.44,153.52.47,192.25-4.16,9.85-1.18,13.22-13.75,5.29-19.7l-35.17-26.37c-3.1-2.33-3.57-6.8-1.02-9.72,103.04-118.15,93.62-227.41-15.41-311.86-5.07-3.93-12.48-.42-12.71,5.99Z"/>
                </svg>
                
                {/* Floating elements around the cart */}
                <div className="absolute -top-6 -right-6 bg-white rounded-full p-4 shadow-lg animate-bounce">
                  <div className="w-8 h-8 bg-[#ec2538] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">%</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -left-6 bg-white rounded-full p-4 shadow-lg animate-pulse">
                  <div className="w-8 h-8 bg-[#fec806] rounded-full flex items-center justify-center">
                    <span className="text-black text-sm font-bold">$</span>
                  </div>
                </div>
                
                <div className="absolute top-1/2 -right-12 bg-white rounded-full p-3 shadow-lg animate-bounce" style={{animationDelay: '0.5s'}}>
                  <div className="w-6 h-6 bg-[#FF8C00] rounded-full"></div>
                </div>
              </motion.div>
              
              {/* Stats below the cart */}
              <div className="mt-12 grid grid-cols-3 gap-8 text-center">
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg"
                  variants={statCardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                >
                  <div className="text-3xl font-bold text-[#ec2538]">50K+</div>
                  <div className="text-sm text-gray-600">Clientes Felices</div>
                </motion.div>
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg"
                  variants={statCardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  <div className="text-3xl font-bold text-[#FF8C00]">10K+</div>
                  <div className="text-sm text-gray-600">Productos</div>
                </motion.div>
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg"
                  variants={statCardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={2}
                >
                  <div className="text-3xl font-bold text-[#fec806]">24/7</div>
                  <div className="text-sm text-gray-600">Soporte</div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EcommerceHeroCarousel