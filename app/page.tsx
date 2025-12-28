import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import { VALUE_PROPS, FEATURED_ITEMS, TESTIMONIALS, TESTIMONIAL_META } from "@/lib/home-data";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";


export default function Home() {
  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-3">
      <Hero />

      {/* Value Props */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">What we build for</h2>
        <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Simple, durable work—designed to fit your space and your style.
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

      {/* Featured */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Featured work</h2>
            <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              A few recent pieces—see the gallery for more.
            </p>
          </div>

          <Link href="/gallery2" className="ui-link text-sm hidden sm:inline">
            View full gallery →
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {FEATURED_ITEMS.slice(0, 2).map((item) => (
            <Link key={item.id} href={item.href} className="ui-card overflow-hidden group">
              <div className="relative aspect-4/3">
                <Image
                  src={item.imageSrc}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {item.tag ? (
                  <div className="absolute left-4 top-4 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
                    {item.tag}
                  </div>
                ) : null}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                    View →
                  </span>
                </div>
                <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link href="/gallery2" className="ui-btn ui-btn-secondary w-full text-center">
            View full gallery
          </Link>
        </div>
      </section>

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

        <div className="mt-8">
          <Link href="/contact" className="ui-btn ui-btn-primary w-full sm:w-auto text-center">
            Request a quote
          </Link>
        </div>
      </section>
    </main>
  );
}
