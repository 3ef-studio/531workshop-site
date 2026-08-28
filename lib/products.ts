import type { Product } from "@/types/product";
import data from "@/data/products.json";

export async function getAllProducts(): Promise<Product[]> {
  // The JSON file already exports a { products: Product[] } shape
  const { products } = data as { products: Product[] };
  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const all = await getAllProducts();
  return all.map((p) => p.slug);
}

/**
 * Parse a `price_display` string (e.g. "$45", "$175 - $290") to a sortable number.
 * Non-parseable / missing values sort last. Extracted from app/shop/page.tsx so the
 * catalog ordering can be unit-tested; logic is unchanged.
 */
export function parsePriceNumber(s: string | null | undefined): number {
  if (!s) return Number.POSITIVE_INFINITY;

  // strip everything except digits/decimal/sign
  const cleaned = s.replace(/[^0-9.-]+/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

/**
 * Catalog ordering used by /shop: available products first, then ascending price,
 * then title as a tie-breaker. Returns a new array; does not mutate the input.
 */
export function sortProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    // available first
    if (a.status !== b.status) return a.status === "available" ? -1 : 1;

    // then price low -> high
    const aPrice = parsePriceNumber(a.price_display);
    const bPrice = parsePriceNumber(b.price_display);
    if (aPrice !== bPrice) return aPrice - bPrice;

    // tie-breaker
    return a.title.localeCompare(b.title);
  });
}