import { get } from "@/utils/apiWrapper";

export interface HomepageStats {
  total_clients: number;
  total_products: number;
}

export async function getHomepageStats(): Promise<HomepageStats> {
  return get<HomepageStats>("/homepage/stats");
}
