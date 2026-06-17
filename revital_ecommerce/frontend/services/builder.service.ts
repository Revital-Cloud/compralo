import { get, post, put, del } from "@/utils/apiWrapper";
import type { BuilderSection } from "@/components/builder/builder-types";

export type BuilderPageStatus = "published" | "draft";

export interface BuilderSeo {
  title: string | null;
  description: string | null;
  og_image: string | null;
}

export interface BuilderPageSummary {
  slug: string;
  title: string;
  is_home: boolean;
  status: BuilderPageStatus;
  num_version: number;
  section_count: number;
  updated_at: string | null;
}

export interface BuilderPageDetail {
  slug: string;
  title: string;
  is_home: boolean;
  status: BuilderPageStatus;
  num_version: number;
  seo: BuilderSeo;
  sections: BuilderSection[];
  has_published: boolean;
}

export interface BuilderPagePublic {
  slug: string;
  title: string;
  seo: BuilderSeo;
  sections: BuilderSection[];
}

export interface BuilderSavePayload {
  title: string;
  seo: BuilderSeo;
  sections: BuilderSection[];
}

export interface BuilderCreatePayload {
  slug: string;
  title: string;
  seo?: BuilderSeo;
  sections?: BuilderSection[];
}

export const builderService = {
  async listPages(): Promise<BuilderPageSummary[]> {
    return get<BuilderPageSummary[]>("/builder/pages");
  },

  async getPage(slug: string): Promise<BuilderPageDetail | null> {
    try {
      return await get<BuilderPageDetail>(`/builder/pages/${slug}`);
    } catch (err: unknown) {
      if ((err as { response?: { status?: number } })?.response?.status === 404) return null;
      throw err;
    }
  },

  async createPage(payload: BuilderCreatePayload): Promise<{ message: string }> {
    return post<{ message: string }>("/builder/pages", payload);
  },

  async savePage(slug: string, payload: BuilderSavePayload): Promise<{ message: string }> {
    return put<{ message: string }>(`/builder/pages/${slug}`, payload);
  },

  async publishPage(slug: string): Promise<{ message: string }> {
    return post<{ message: string }>(`/builder/pages/${slug}/publish`);
  },

  async deletePage(slug: string): Promise<{ message: string }> {
    return del<{ message: string }>(`/builder/pages/${slug}`);
  },

  async getPublicPage(slug: string): Promise<BuilderPagePublic | null> {
    try {
      return await get<BuilderPagePublic | null>(`/builder/public/${slug}`);
    } catch {
      return null;
    }
  },
};

export default builderService;
