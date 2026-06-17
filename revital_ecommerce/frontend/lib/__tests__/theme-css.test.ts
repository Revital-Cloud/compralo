import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, fontHref, hexToRgbChannels, themeToCssText } from "@/lib/theme-css";

describe("hexToRgbChannels", () => {
  it("convierte hex de 6 dígitos a canales 'R G B'", () => {
    expect(hexToRgbChannels("#ec2538")).toBe("236 37 56");
    expect(hexToRgbChannels("#FF8C00")).toBe("255 140 0");
  });
  it("soporta hex de 3 dígitos y entradas inválidas", () => {
    expect(hexToRgbChannels("#fff")).toBe("255 255 255");
    expect(hexToRgbChannels("nope")).toBe("0 0 0");
  });
});

describe("themeToCssText", () => {
  it("emite variables de marca y shadcn con alta especificidad", () => {
    const css = themeToCssText(DEFAULT_THEME);
    expect(css).toContain("html:root{");
    expect(css).toContain("html.dark{");
    expect(css).toContain("--brand-primary:#ec2538");
    expect(css).toContain("--primary:#ec2538");
    expect(css).toContain("--brand-accent:#FF8C00");
    expect(css).toContain("--radius:0.625rem");
  });

  it("usa los colores oscuros en el bloque html.dark", () => {
    const css = themeToCssText(DEFAULT_THEME);
    const darkBlock = css.slice(css.indexOf("html.dark{"));
    expect(darkBlock).toContain("--background:#0b1220");
    expect(darkBlock).toContain("--foreground:#FFFFFF");
  });

  it("refleja colores personalizados", () => {
    const custom = {
      ...DEFAULT_THEME,
      theme: { ...DEFAULT_THEME.theme, colors: { ...DEFAULT_THEME.theme.colors, primary: "#123456" } },
    };
    expect(themeToCssText(custom)).toContain("--brand-primary:#123456");
  });
});

describe("fontHref", () => {
  it("devuelve null para Geist (ya cargada) y fuentes desconocidas", () => {
    expect(fontHref("Geist")).toBeNull();
    expect(fontHref("FuenteRara")).toBeNull();
    expect(fontHref("")).toBeNull();
  });

  it("devuelve un href de Google Fonts para fuentes soportadas", () => {
    expect(fontHref("Poppins")).toContain("family=Poppins");
    expect(fontHref("Open Sans")).toContain("family=Open+Sans");
  });
});
