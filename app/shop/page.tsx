import { getAllProducts, sortProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Products • 531 Workshop",
  description: "Products from 531 Workshop.",
  alternates: { canonical: "/shop" },
};

export default async function ProductsPage() {
  const products = await getAllProducts();
  const ordered = sortProducts(products);

  if (!ordered.length) {
    return (
      <div className="py-12 px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Products</h1>
        <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
          <p className="text-muted-foreground mt-2">
            Nothing here yet—check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-10">
       <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Products</h1>
        <div className="mt-4 space-y-3">
          <p className="text-muted-foreground max-w-2xl">
            Custom made products from 531 Workshop.
          </p>
        </div>
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
