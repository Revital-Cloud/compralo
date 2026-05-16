import type { NextConfig } from "next";

/**
 * En dev, el navegador llama a `/api-be/*` (mismo origen que el shop) y Next reescribe al FastAPI.
 * Así evita CORS/CSP y el caso "abro el front por IP pero NEXT_PUBLIC_API_URL es localhost".
 */
const devInternalApiOrigin = (
  process.env.DEV_INTERNAL_API_ORIGIN || "http://127.0.0.1:8001"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@node-rs/argon2'],
  async rewrites() {
    if (process.env.NODE_ENV !== "development") {
      return [];
    }
    return [
      {
        source: "/api-be/:path*",
        destination: `${devInternalApiOrigin}/api/:path*`,
      },
    ];
  },
  // En producción no se muestran console.log/info/debug/warn; solo console.error
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error'] }
        : false,
  },
  // Configuración de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Configuración de seguridad
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      throw new Error('NEXT_PUBLIC_API_URL no está definida en las variables de entorno');
    }
    
    // CSP connect-src requiere el ORIGEN (sin path): así se permiten todas las rutas /api/*.
    // Si se usa solo "http://host:8000/api", algunos navegadores bloquean /api/carrito-usuario, etc.
    const apiOrigin = (() => {
      const u = new URL(apiUrl);
      return `${u.protocol}//${u.host}`;
    })();

    const connectSrc = [
      "'self'",
      apiOrigin,
      "https://api.revital.com",
      "https://*.cloudinary.com",
      "https://sandbox.wompi.co",
      "https://production.wompi.co",
      "https://checkout.wompi.co",
      "https://challenges.cloudflare.com",
      ...(isDevelopment
        ? [
            "http://localhost:8000",
            "http://localhost:8001",
            "http://localhost:8002",
            "http://127.0.0.1:8000",
            "http://127.0.0.1:8001",
            "http://127.0.0.1:8002",
            "ws://localhost:*",
            "ws://127.0.0.1:*",
          ]
        : []),
    ].join(' ');

    return [
      {
        // Aplicar a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          ...(isDevelopment
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains'
                }
              ]),
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://checkout.wompi.co https://static.cloudflareinsights.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              `connect-src ${connectSrc}`,
              "frame-src 'self' https://checkout.wompi.co https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.wompi.co",
              "frame-ancestors 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
};

export default nextConfig;
