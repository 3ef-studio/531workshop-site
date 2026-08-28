import { describe, it, expect } from "vitest";
import {
  getAllProducts,
  getProductBySlug,
  getAllProductSlugs,
  parsePriceNumber,
  sortProducts,
} from "@/lib/products";
import type { Product } from "@/types/product";

describe("catalog loading (data/products.json)", () => {
  it("loads every product with the fields the UI relies on", async () => {
    const products = await getAllProducts();
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(typeof p.slug).toBe("string");
      expect(p.slug.length).toBeGreaterThan(0);
      expect(typeof p.title).toBe("string");
      expect(["available", "coming-soon", "made_to_order"]).toContain(p.status);
    }
  });

  it("has unique slugs", async () => {
    const slugs = await getAllProductSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves a known slug and returns undefined for an unknown one", async () => {
    const slugs = await getAllProductSlugs();
    const known = await getProductBySlug(slugs[0]);
    expect(known?.slug).toBe(slugs[0]);
    expect(await getProductBySlug("does-not-exist")).toBeUndefined();
  });

  it("every cta_primary.url points at an in-repo /shop/<slug> route", async () => {
    const products = await getAllProducts();
    const slugs = new Set(products.map((p) => p.slug));
    for (const p of products) {
      if (!p.cta_primary) continue;
      const m = p.cta_primary.url.match(/^\/shop\/(.+)$/);
      if (m) expect(slugs.has(m[1])).toBe(true);
    }
  });
});

describe("parsePriceNumber", () => {
  it("parses a plain price", () => {
    expect(parsePriceNumber("$45")).toBe(45);
    expect(parsePriceNumber("$1,250.50".replace(",", ""))).toBe(1250.5);
  });

  it("returns +Infinity for missing values", () => {
    expect(parsePriceNumber(undefined)).toBe(Number.POSITIVE_INFINITY);
    expect(parsePriceNumber(null)).toBe(Number.POSITIVE_INFINITY);
    expect(parsePriceNumber("")).toBe(Number.POSITIVE_INFINITY);
  });

  it("documents CURRENT behavior: a range string is not parseable and sorts last (see TECHNICAL_DEBT F4)", () => {
    // "$175 - $290" -> "175-290" -> Number(...) -> NaN -> +Infinity
    expect(parsePriceNumber("$175 - $290")).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("sortProducts", () => {
  const make = (over: Partial<Product>): Product => ({
    slug: over.slug ?? "s",
    title: over.title ?? "T",
    summary: "",
    status: over.status ?? "available",
    price_display: over.price_display,
  });

  it("orders available products before non-available ones", () => {
    const out = sortProducts([
      make({ slug: "soon", status: "coming-soon", price_display: "$1" }),
      make({ slug: "avail", status: "available", price_display: "$999" }),
    ]);
    expect(out.map((p) => p.slug)).toEqual(["avail", "soon"]);
  });

  it("orders available products by ascending price, then title", () => {
    const out = sortProducts([
      make({ slug: "c", title: "C", price_display: "$100" }),
      make({ slug: "a", title: "A", price_display: "$45" }),
      make({ slug: "b", title: "B", price_display: "$45" }),
    ]);
    expect(out.map((p) => p.slug)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      make({ slug: "b", price_display: "$2" }),
      make({ slug: "a", price_display: "$1" }),
    ];
    const snapshot = input.map((p) => p.slug);
    sortProducts(input);
    expect(input.map((p) => p.slug)).toEqual(snapshot);
  });

  it("keeps the real catalog available-first", async () => {
    const ordered = sortProducts(await getAllProducts());
    const firstNonAvailable = ordered.findIndex((p) => p.status !== "available");
    if (firstNonAvailable !== -1) {
      expect(
        ordered.slice(firstNonAvailable).every((p) => p.status !== "available"),
      ).toBe(true);
    }
  });
});
