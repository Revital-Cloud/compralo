"use client";

import { useQuery } from "@tanstack/react-query";

import { themeService } from "@/services/theme.service";

/**
 * Marca + logo del Theme global publicado, para usar en chrome client-side
 * (p. ej. el sidebar del admin). Cae a "Compralo" si no hay theme publicado.
 */
export function useSiteBrand(): { brand: string; logoUrl: string | null } {
  const { data } = useQuery({
    queryKey: ["site-theme", "public"],
    queryFn: () => themeService.getPublicTheme(),
    staleTime: 1000 * 60,
  });

  return {
    brand: data?.header?.brand?.trim() || "Compralo",
    logoUrl: data?.theme?.logo_url?.trim() || null,
  };
}
