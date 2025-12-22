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