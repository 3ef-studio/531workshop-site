import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";

type Params = { slug: string };
type PageProps = { params: Promise<Params> }; // params is a Promise

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.title} • 531 Workshop`;
  const description = product.summary ?? "A 531 Workshop product.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/shop/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const {
    title,
    summary,
    price_display,
    badges = [],
    cta_primary,
    pricing,
    features,
    status,
    image_hero,
    image_thumb,
  } = product;

  const heroSrc = image_hero ?? image_thumb;

  const isRapid = pricing?.provider === "rapidapi";
  const tiers = isRapid && "tiers" in (pricing ?? {}) ? pricing?.tiers ?? [] : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16 space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/shop" className="underline-offset-2 hover:underline">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white/80">{title}</span>
      </nav>

      {/* Hero image */}
      {heroSrc ? (
        <div className="ui-card overflow-hidden">
          <div className="relative w-full aspect-21/9">
            <Image
              src={heroSrc}
              alt={title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b}
              className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-white/80"
            >
              {b}
            </span>
          ))}
          {isRapid && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/60">
              RapidAPI
            </span>
          )}
          {status === "coming-soon" && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/60">
              Coming Soon
            </span>
          )}
        </div>

        <h1 className="text-3xl font-semibold">{title}</h1>

        {summary ? (
          <p className="text-muted-foreground max-w-2xl">{summary}</p>
        ) : null}

        {(price_display || (isRapid && tiers[0]?.price_month)) ? (
          <div className="text-sm font-medium">
            {price_display ?? `From $${tiers[0]?.price_month}/mo`}
          </div>
        ) : null}

        {cta_primary && status !== "coming-soon" ? (
          <Link
            href={cta_primary.url}
            className="inline-flex items-center rounded-xl px-4 py-2 bg-accent text-accent-foreground font-medium"
          >
            {cta_primary.label}
          </Link>
        ) : null}
      </header>

      {isRapid && tiers.length > 0 ? (
        <section className="max-w-lg rounded-2xl bg-card border border-white/5 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Pricing Tiers</h2>
          <div className="divide-y divide-white/10">
            {tiers.map((t) => (
              <div key={t.name} className="py-3 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{t.name}</div>
                  {t.rate_limit ? (
                    <div className="text-muted-foreground">{t.rate_limit}</div>
                  ) : null}
                </div>
                <div className="text-sm">
                  {typeof t.price_month === "number" ? `$${t.price_month}/mo` : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {features && features.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Details</h2>
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
