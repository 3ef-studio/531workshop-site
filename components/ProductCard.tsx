import Link from "next/link";
import type { Product } from "@/types/product";

type Props = { product: Product };

export default function ProductCard({ product }: Props) {
  const {
    title,
    summary,
    price_display,
    badges = [],
    cta_primary,
    pricing,
    status,
  } = product;

  const isRapid = pricing?.provider === "rapidapi";
  const tiers = pricing && "tiers" in pricing ? pricing.tiers ?? [] : [];
  const fromTier = tiers[0];

  return (
    <article
      className="rounded-2xl bg-card shadow-soft border border-white/5 hover:border-white/10 transition p-5 h-full flex flex-col"
      aria-live="polite"
    >
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
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

      {/* Title & summary */}
     <h3 className="text-xl font-semibold">
        <Link href={`/products/${product.slug}`} className="hover:underline underline-offset-2">
            {title}
        </Link>
      </h3>
      <p className="text-muted-foreground mt-2">{summary}</p>

      {/* Price / tiers */}
      <div className="mt-4 text-sm">
        {price_display ? (
          <div className="font-medium">{price_display}</div>
        ) : isRapid && fromTier?.price_month ? (
          <div className="font-medium">From ${fromTier.price_month}/mo</div>
        ) : null}

        {isRapid && tiers.length > 0 && (
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {tiers.slice(0, 3).map((t) => (
              <li key={t.name} className="flex items-center justify-between">
                <span>
                  {t.name}
                  {t.rate_limit ? ` · ${t.rate_limit}` : ""}
                </span>
                {typeof t.price_month === "number" && (
                  <span>${t.price_month}/mo</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA */}
      <div className="mt-5 pt-1">
        {cta_primary && (
          <Link
            href={cta_primary.url}
            className="inline-flex items-center rounded-xl px-4 py-2 bg-accent text-black font-medium"
          >
            {cta_primary.label}
          </Link>
        )}
      </div>
    </article>
  );
}
