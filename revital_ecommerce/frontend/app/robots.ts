import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/utils/url-helpers";

const baseUrl = getPublicSiteOrigin();

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
