const DEFAULT_PUBLIC_SITE_URL = "https://compralo.revital.cloud";

export function getPublicSiteOrigin(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_CUSTOM_DOMAIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    DEFAULT_PUBLIC_SITE_URL;

  try {
    const normalized = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(normalized);
    parsed.protocol = "https:";
    return parsed.origin;
  } catch {
    return DEFAULT_PUBLIC_SITE_URL;
  }
}
