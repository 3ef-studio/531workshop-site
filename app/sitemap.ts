import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getAllProducts } from "@/lib/products";

/**
 * Public, indexable routes (path suffixes; "" is the homepage). Intentionally excludes:
 *  - /gallery1 — an unlinked internal design alternative (see docs/TECHNICAL_DEBT.md B4)
 *  - API routes and framework routes (/_not-found, etc.)
 */
const STATIC_PATHS = ["", "/about", "/faq", "/gallery2", "/shop", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url.replace(/\/+$/, "");
  const products = await getAllProducts();

  const paths = [
    ...STATIC_PATHS,
    ...products.map((p) => `/shop/${p.slug}`),
  ];

  return paths.map((path) => ({ url: `${base}${path}` }));
}
