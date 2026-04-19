import { THEMES, getTheme, DEFAULT_THEME_ID, type ThemeId } from "@/lib/themes";

describe("THEMES manifest", () => {
  it("should contain exactly 4 themes", () => {
    expect(THEMES).toHaveLength(4);
  });

  it("should have seoul, tokyo, paris, fire ids", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(["seoul", "tokyo", "paris", "fire"]));
  });

  it("should have required fields on every theme", () => {
    for (const theme of THEMES) {
      expect(theme.id).toBeTruthy();
      expect(theme.label).toBeTruthy();
      expect(theme.video).toMatch(/^\/bg\/.+\.webm$/);
      expect(theme.poster).toMatch(/^\/bg\/.+\.jpg$/);
      expect(theme.accent).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      expect(theme.overlay).toBeTruthy();
    }
  });

  it("should have unique ids", () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getTheme", () => {
  it("should return the correct theme by id", () => {
    const theme = getTheme("seoul");
    expect(theme.id).toBe("seoul");
    expect(theme.label).toBe("Seoul Sunrise");
  });

  it("should return tokyo theme", () => {
    expect(getTheme("tokyo").label).toBe("Tokyo Sakura");
  });

  it("should return paris theme", () => {
    expect(getTheme("paris").label).toBe("Rainy Paris");
  });

  it("should return fire theme", () => {
    expect(getTheme("fire").label).toBe("Cozy Fireplace");
  });
});

describe("DEFAULT_THEME_ID", () => {
  it("should be seoul", () => {
    expect(DEFAULT_THEME_ID).toBe("seoul");
  });

  it("should be a valid theme id", () => {
    const ids = THEMES.map((t) => t.id) as ThemeId[];
    expect(ids).toContain(DEFAULT_THEME_ID);
  });
});
