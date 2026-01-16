import Link from "next/link";
import Image from "next/image";
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
    image_thumb,
    image_hero,
  } = product;

  const isRapid = pricing?.provider === "rapidapi";
  const tiers = pricing && "tiers" in pricing ? pricing.tiers ?? [] : [];
  const fromTier = tiers[0];

  // Prefer thumb for grid; fall back to hero
  const thumbSrc = image_thumb ?? image_hero;

  return (
    <article className="ui-card group overflow-hidden p-5 h-full flex flex-col" aria-live="polite">
      {/* Image */}
      {thumbSrc ? (
        <Link href={`/shop/${product.slug}`} className="block">
          <div className="relative w-full aspect-4/3 overflow-hidden rounded-2xl border border-border">
            <Image
              src={thumbSrc}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
      ) : null}

      {/* Badges */}
      <div className={`flex flex-wrap items-center gap-2 ${thumbSrc ? "mt-4" : "mb-3"}`}>
        {badges.map((b) => (
          <span
            key={b}
            className="text-[11px] px-2 py-1 rounded-full border border-border bg-card text-muted-foreground"
          >
            {b}
          </span>
        ))}
        {isRapid && (
          <span className="text-[11px] px-2 py-1 rounded-full border border-border bg-card text-muted-foreground">
            RapidAPI
          </span>
        )}
        {status === "coming-soon" && (
          <span className="text-[11px] px-2 py-1 rounded-full border border-border bg-card text-muted-foreground">
            Coming Soon
          </span>
        )}
      </div>
{/* Title & summary (fixed height) */}
      <div className="mt-3">
        <h3 className="text-lg font-semibold leading-snug line-clamp-2 min-h-12">
          <Link href={`/shop/${product.slug}`} className="hover:underline underline-offset-2">
            {title}
          </Link>
        </h3>

        <p className="text-muted-foreground mt-2 text-sm leading-snug line-clamp-2 min-h-[2.6rem]">
          {summary}
        </p>
      </div>

      {/* Bottom section pinned */}
      <div className="mt-auto pt-4">
        {/* Price / tiers */}
        <div className="text-sm">
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
                  {typeof t.price_month === "number" ? <span>${t.price_month}/mo</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CTA */}
        <div className="mt-5 pt-1">
          {cta_primary ? (
            <Link
              href={cta_primary.url}
              className="inline-flex items-center rounded-xl px-4 py-2 bg-accent text-accent-foreground font-medium hover:opacity-90 transition"
            >
              {cta_primary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
