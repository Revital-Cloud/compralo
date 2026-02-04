import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/config.ts');

const nextConfig: NextConfig = {
  experimental: {
    // Persist Turbopack cache between dev runs so repeat navigations don't recompile
    turbopackFileSystemCacheForDev: true,
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
