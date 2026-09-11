import { test, expect } from "./fixtures";

/** The <link rel="canonical"> href for the current page, or null. */
async function canonicalHref(page: import("@playwright/test").Page) {
  const link = page.locator('link[rel="canonical"]');
  if ((await link.count()) === 0) return null;
  return link.first().getAttribute("href");
}

test.describe("D1 — per-route canonical URLs", () => {
  const cases: Array<[string, string]> = [
    ["/", "/"],
    ["/about", "/about"],
    ["/faq", "/faq"],
    ["/gallery", "/gallery"],
    ["/gallery/tables", "/gallery/tables"],
    ["/gallery/tables/live-edge-coffee-table", "/gallery/tables/live-edge-coffee-table"],
    ["/shop", "/shop"],
    ["/contact", "/contact"],
    ["/shop/small-board", "/shop/small-board"],
  ];

  for (const [route, expectedPath] of cases) {
    test(`${route} canonicalizes to ${expectedPath}`, async ({ page }) => {
      await page.goto(route);
      const href = await canonicalHref(page);
      expect(href, `${route} should emit a canonical link`).toBeTruthy();
      expect(new URL(href!).pathname).toBe(expectedPath);
    });
  }

  test("interior pages no longer canonicalize to the homepage", async ({ page }) => {
    for (const route of ["/about", "/faq", "/gallery", "/shop", "/contact", "/shop/small-board"]) {
      await page.goto(route);
      const href = await canonicalHref(page);
      expect(new URL(href!).pathname, `${route} must not point at "/"`).not.toBe("/");
    }
  });

  test("a second product detail page emits its own canonical", async ({ page }) => {
    await page.goto("/shop/large-endgrain-board");
    const href = await canonicalHref(page);
    expect(new URL(href!).pathname).toBe("/shop/large-endgrain-board");
  });

  test("a second gallery category and project page emit their own canonicals", async ({
    page,
  }) => {
    await page.goto("/gallery/cutting-boards");
    expect(new URL((await canonicalHref(page))!).pathname).toBe("/gallery/cutting-boards");

    await page.goto("/gallery/cutting-boards/checkerboard-cutting-board");
    expect(new URL((await canonicalHref(page))!).pathname).toBe(
      "/gallery/cutting-boards/checkerboard-cutting-board"
    );
  });

  test("the ?confirmed query variant of /contact still canonicalizes to /contact", async ({
    page,
  }) => {
    await page.goto("/contact?confirmed=1");
    const href = await canonicalHref(page);
    expect(new URL(href!).pathname).toBe("/contact");
    expect(new URL(href!).search).toBe("");
  });
});

test.describe("D2 — sitemap.xml and robots.txt", () => {
  test("sitemap.xml is generated and lists public routes + product pages", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");

    const body = await res.text();
    for (const path of ["/about", "/faq", "/gallery", "/shop", "/contact"]) {
      expect(body).toContain(`<loc>http://localhost:3000${path}</loc>`);
    }
    // product detail routes derived from data/products.json
    expect(body).toContain("<loc>http://localhost:3000/shop/small-board</loc>");
    expect(body).toContain("<loc>http://localhost:3000/shop/large-endgrain-board</loc>");
    // gallery category + project routes derived from lib/gallery-data.ts
    expect(body).toContain("<loc>http://localhost:3000/gallery/tables</loc>");
    expect(body).toContain(
      "<loc>http://localhost:3000/gallery/tables/live-edge-coffee-table</loc>"
    );
    // excluded
    expect(body).not.toContain("/gallery1");
    expect(body).not.toContain("/gallery2");
    expect(body).not.toContain("/api/");
  });

  test("/gallery2 permanently redirects to /gallery", async ({ request }) => {
    const res = await request.get("/gallery2", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/gallery");
  });

  test("robots.txt is generated and references the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);

    const body = await res.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toMatch(/Allow:\s*\//i);
    expect(body).toMatch(/Sitemap:\s*http:\/\/localhost:3000\/sitemap\.xml/i);
  });
});
