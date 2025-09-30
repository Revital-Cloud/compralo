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
        hostname: '**',
      },
    ],
    // Alternativa: deshabilitar completamente la validación de dominios
    // unoptimized: true,
  },
  // Configuración para optimizar el renderizado de componentes

};

export default nextConfig;
