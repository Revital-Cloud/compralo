import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/config.ts');

const nextConfig: NextConfig = {
<<<<<<< HEAD:synkro_panel/frontend/next.config.ts
  experimental: {
    // Persist Turbopack cache between dev runs so repeat navigations don't recompile
    turbopackFileSystemCacheForDev: true,
=======
  /* config options here */
  // En producción no se muestran console.log/info/debug/warn; solo console.error
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error'] }
        : false,
>>>>>>> main:revital_panel/frontend/next.config.ts
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/lrigu76hy/tailark/**",
      },
      {
        protocol: "https",
        hostname: "tailark.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "html.tailus.io",
        port: "",
        pathname: "/blocks/customers/**",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/lrigu76hy/tailark/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
