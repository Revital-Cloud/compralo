import { beforeEach, describe, expect, it, vi } from "vitest";

import { get, post, put, del } from "@/utils/apiWrapper";
import { builderService } from "@/services/builder.service";

vi.mock("@/utils/apiWrapper", () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

const mockGet = vi.mocked(get);
const mockPost = vi.mocked(post);
const mockPut = vi.mocked(put);
const mockDel = vi.mocked(del);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("builderService", () => {
  it("listPages llama al endpoint admin", async () => {
    mockGet.mockResolvedValueOnce([]);
    await builderService.listPages();
    expect(mockGet).toHaveBeenCalledWith("/builder/pages");
  });

  it("getPage devuelve la página", async () => {
    const page = { slug: "home", sections: [] };
    mockGet.mockResolvedValueOnce(page);
    const result = await builderService.getPage("home");
    expect(mockGet).toHaveBeenCalledWith("/builder/pages/home");
    expect(result).toBe(page);
  });

  it("getPage devuelve null en 404", async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    const result = await builderService.getPage("no-existe");
    expect(result).toBeNull();
  });

  it("getPage relanza errores que no son 404", async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 500 } });
    await expect(builderService.getPage("home")).rejects.toBeTruthy();
  });

  it("createPage hace POST con el payload", async () => {
    mockPost.mockResolvedValueOnce({ message: "ok" });
    await builderService.createPage({ slug: "about", title: "Sobre" });
    expect(mockPost).toHaveBeenCalledWith("/builder/pages", { slug: "about", title: "Sobre" });
  });

  it("savePage hace PUT al slug", async () => {
    mockPut.mockResolvedValueOnce({ message: "ok" });
    const payload = {
      title: "Home",
      seo: { title: null, description: null, og_image: null },
      sections: [],
    };
    await builderService.savePage("home", payload);
    expect(mockPut).toHaveBeenCalledWith("/builder/pages/home", payload);
  });

  it("publishPage hace POST a /publish", async () => {
    mockPost.mockResolvedValueOnce({ message: "ok" });
    await builderService.publishPage("home");
    expect(mockPost).toHaveBeenCalledWith("/builder/pages/home/publish");
  });

  it("deletePage hace DELETE al slug", async () => {
    mockDel.mockResolvedValueOnce({ message: "ok" });
    await builderService.deletePage("about");
    expect(mockDel).toHaveBeenCalledWith("/builder/pages/about");
  });

  it("getPublicPage devuelve null si falla", async () => {
    mockGet.mockRejectedValueOnce(new Error("network"));
    const result = await builderService.getPublicPage("home");
    expect(result).toBeNull();
    expect(mockGet).toHaveBeenCalledWith("/builder/public/home");
  });
});
