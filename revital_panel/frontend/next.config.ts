import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/config.ts');

const nextConfig: NextConfig = {
  /* config options here */
  // En producción no se muestran console.log/info/debug/warn; solo console.error
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error'] }
        : false,
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
