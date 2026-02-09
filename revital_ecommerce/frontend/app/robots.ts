import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_CUSTOM_DOMAIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "http://46.224.101.179:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
