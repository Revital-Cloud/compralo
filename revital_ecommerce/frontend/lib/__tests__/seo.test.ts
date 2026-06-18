import { describe, expect, it } from "vitest";

import { buildCanonical, safeJsonLd } from "@/lib/seo";

describe("safeJsonLd", () => {
  it("escapa '<' para evitar cerrar el <script> (XSS)", () => {
    const out = safeJsonLd({ name: "Hola </script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
  });

  it("produce JSON parseable equivalente", () => {
    const obj = { a: 1, b: "texto", c: ["x", "y"] };
    expect(JSON.parse(safeJsonLd(obj).replace(/\\u003c/g, "<"))).toEqual(obj);
  });
});

describe("buildCanonical", () => {
  it("devuelve una URL absoluta para una ruta", () => {
    expect(buildCanonical("/p/promo")).toMatch(/\/p\/promo$/);
  });
});
