import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Products • 531 Workshop",
  description: "Products from 531 Workshop.",
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  const ordered = [...products].sort((a, b) => {
    // available first, then alpha by title
    if (a.status !== b.status) return a.status === "available" ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  if (!ordered.length) {
    return (
      <div className="py-12 px-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-muted-foreground mt-2">
          Nothing here yet—check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="text-muted-foreground max-w-2xl">
          Custom made products from 531 Workshop.
        </p>
      </header>

      <section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
