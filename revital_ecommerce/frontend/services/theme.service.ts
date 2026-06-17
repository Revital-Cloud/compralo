import { get, put, post } from "@/utils/apiWrapper";
import type { SiteTheme, SiteThemeDetail } from "@/lib/theme-types";

export type { SiteTheme, SiteThemeDetail } from "@/lib/theme-types";

export const themeService = {
  async getTheme(): Promise<SiteThemeDetail | null> {
    try {
      return await get<SiteThemeDetail>("/builder/theme");
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
      throw err;
    }
  },

  async saveTheme(payload: SiteTheme): Promise<{ message: string }> {
    return put<{ message: string }>("/builder/theme", payload);
  },

  async publishTheme(): Promise<{ message: string }> {
    return post<{ message: string }>("/builder/theme/publish");
  },

  async getPublicTheme(): Promise<SiteTheme | null> {
    try {
      return await get<SiteTheme | null>("/builder/theme/public");
    } catch {
      return null;
    }
  },
};

export default themeService;
