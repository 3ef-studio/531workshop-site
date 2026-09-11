import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getAllProducts } from "@/lib/products";
import { CATEGORIES, GALLERY_IMAGES } from "@/lib/gallery-data";

/**
 * Public, indexable routes (path suffixes; "" is the homepage). Intentionally excludes:
 *  - /gallery1 — an unlinked internal design alternative (see docs/TECHNICAL_DEBT.md B4)
 *  - /gallery2 — retired; permanently redirects to /gallery (see next.config.ts)
 *  - API routes and framework routes (/_not-found, etc.)
 */
const STATIC_PATHS = ["", "/about", "/faq", "/gallery", "/shop", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/+$/, "");
  const products = await getAllProducts();

  const paths = [
    ...STATIC_PATHS,
    ...products.map((p) => `/shop/${p.slug}`),
    ...CATEGORIES.map((c) => `/gallery/${c.value}`),
    ...GALLERY_IMAGES.map((item) => `/gallery/${item.category}/${item.slug}`),
  ];

  return paths.map((path) => ({ url: `${base}${path}` }));
}
