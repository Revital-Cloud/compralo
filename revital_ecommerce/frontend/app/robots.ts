import type { MetadataRoute } from "next";

const baseUrl = (() => {
  const rawUrl =
    process.env.NEXT_PUBLIC_CUSTOM_DOMAIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://compralo.com";

  try {
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(normalized);
    parsed.protocol = "https:";
    return parsed.origin;
  } catch {
    return "https://compralo.com";
  }
})();

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
