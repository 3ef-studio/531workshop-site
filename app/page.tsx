import type { Metadata } from "next";
import Link from "next/link";
import Hero from "@/components/Hero";
import { VALUE_PROPS, FEATURED_PRODUCT_SLUGS, TESTIMONIALS, TESTIMONIAL_META } from "@/lib/home-data";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import ProductCard from "@/components/ProductCard";
import { getProductBySlug } from "@/lib/products";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const featuredProducts = (
    await Promise.all(FEATURED_PRODUCT_SLUGS.map((slug) => getProductBySlug(slug)))
  ).filter((p): p is Product => Boolean(p));

  if (process.env.NODE_ENV !== "production" && featuredProducts.length !== FEATURED_PRODUCT_SLUGS.length) {
    const missing = FEATURED_PRODUCT_SLUGS.filter(
      (slug) => !featuredProducts.some((p) => p.slug === slug)
    );
    console.warn(
      `Home: FEATURED_PRODUCT_SLUGS references unknown slug(s): ${missing.join(", ")}. Skipping.`
    );
  }

  return (
    <main className="mx-auto max-w-6xl">
      <Hero />

      {/* Value Props */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Custom Projects</h2>
        <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Hardwood furniture - designed just for you. Built to last a lifetime.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {VALUE_PROPS.map((p) => (
            <div key={p.title} className="ui-card p-6">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </section>
          <div className="mt-8">
          <Link href="/contact" className="ui-btn ui-btn-primary w-full sm:w-auto text-center">
            Request a quote
          </Link>
        </div>
      {/* Shop preview — a compact entry point into the product catalog;
          the Gallery link above already covers custom-project inspiration. */}
      {featuredProducts.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Shop</h2>
              <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                Handmade cutting boards for your kitchen.
              </p>
            </div>

            <Link href="/shop" className="ui-link text-sm hidden sm:inline">
              View All Products →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          <div className="mt-6 sm:hidden">
            <Link href="/shop" className="ui-btn ui-btn-secondary w-full text-center">
              View All Products
            </Link>
          </div>
        </section>
      ) : null}

      {/* Testimonials */}
      <section className="mt-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              What clients say
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Based on completed custom projects
            </p>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex text-yellow-500">
              ★★★★★
            </div>
            <span className="font-medium">
              {TESTIMONIAL_META.rating}
            </span>
            <span style={{ color: "hsl(var(--muted-foreground))" }}>
              ({TESTIMONIAL_META.count} projects)
            </span>
          </div>
        </div>

        <div className="mt-6">
          <TestimonialsCarousel items={TESTIMONIALS} />
        </div>

        
      </section>
    </main>
  );
}
