import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Variables de entorno personalizadas (ya están disponibles las NEXT_PUBLIC_*)
    CUSTOM_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  // Configuración para optimizar el renderizado de componentes
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
