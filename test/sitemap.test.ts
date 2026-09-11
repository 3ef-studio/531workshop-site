import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { getAllProducts } from "@/lib/products";
import { CATEGORIES, GALLERY_IMAGES } from "@/lib/gallery-data";
import { SITE } from "@/lib/site";

const ORIGIN = SITE.url.replace(/\/+$/, "");

describe("app/sitemap.ts", () => {
  it("lists the public static routes plus every product detail page", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    const products = await getAllProducts();

    for (const path of ["", "/about", "/faq", "/gallery", "/shop", "/contact"]) {
      expect(urls).toContain(`${ORIGIN}${path}`);
    }
    for (const p of products) {
      expect(urls).toContain(`${ORIGIN}/shop/${p.slug}`);
    }
    expect(entries).toHaveLength(
      6 + products.length + CATEGORIES.length + GALLERY_IMAGES.length
    );
  });

  it("lists every gallery category and project page", async () => {
    const urls = (await sitemap()).map((e) => e.url);

    for (const category of CATEGORIES) {
      expect(urls).toContain(`${ORIGIN}/gallery/${category.value}`);
    }
    for (const item of GALLERY_IMAGES) {
      expect(urls).toContain(`${ORIGIN}/gallery/${item.category}/${item.slug}`);
    }
  });

  it("excludes orphaned, internal, and framework routes", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.includes("/gallery1"))).toBe(false);
    expect(urls.some((u) => u.includes("/gallery2"))).toBe(false);
    expect(urls.some((u) => u.includes("/api/"))).toBe(false);
    expect(urls.some((u) => u.includes("_not-found"))).toBe(false);
    expect(urls.some((u) => u.includes("/shop/[slug]"))).toBe(false);
  });

  it("uses the configured site origin for every entry", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.every((u) => u === ORIGIN || u.startsWith(`${ORIGIN}/`))).toBe(true);
  });
});

describe("app/robots.ts", () => {
  it("allows crawling the public site, disallows /api/, and points at the sitemap", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules?.userAgent).toBe("*");
    expect(rules?.allow).toBe("/");
    expect(rules?.disallow).toBe("/api/");
    expect(r.sitemap).toBe(`${ORIGIN}/sitemap.xml`);
  });
});
