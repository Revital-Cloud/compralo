import { beforeEach, describe, expect, it, vi } from "vitest";

import { get, put, post } from "@/utils/apiWrapper";
import { themeService } from "@/services/theme.service";

vi.mock("@/utils/apiWrapper", () => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
}));

const mockGet = vi.mocked(get);
const mockPut = vi.mocked(put);
const mockPost = vi.mocked(post);

beforeEach(() => vi.clearAllMocks());

describe("themeService", () => {
  it("getTheme pega al endpoint admin", async () => {
    mockGet.mockResolvedValueOnce({});
    await themeService.getTheme();
    expect(mockGet).toHaveBeenCalledWith("/builder/theme");
  });

  it("getTheme devuelve null en 404", async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 404 } });
    expect(await themeService.getTheme()).toBeNull();
  });

  it("saveTheme hace PUT con el payload", async () => {
    mockPut.mockResolvedValueOnce({ message: "ok" });
    const payload = { theme: {}, header: {}, footer: {} } as never;
    await themeService.saveTheme(payload);
    expect(mockPut).toHaveBeenCalledWith("/builder/theme", payload);
  });

  it("publishTheme hace POST a /publish", async () => {
    mockPost.mockResolvedValueOnce({ message: "ok" });
    await themeService.publishTheme();
    expect(mockPost).toHaveBeenCalledWith("/builder/theme/publish");
  });

  it("getPublicTheme devuelve null si falla", async () => {
    mockGet.mockRejectedValueOnce(new Error("network"));
    expect(await themeService.getPublicTheme()).toBeNull();
    expect(mockGet).toHaveBeenCalledWith("/builder/theme/public");
  });
});
