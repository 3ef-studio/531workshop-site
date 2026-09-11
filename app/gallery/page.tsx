import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import GalleryCard from "@/components/GalleryCard";
import { GALLERY_IMAGES, CATEGORIES, getGalleryItemsByCategory } from "@/lib/gallery-data";

export const metadata: Metadata = {
  alternates: { canonical: "/gallery" },
};

function getMosaicSpan(index: number): string {
  const i = index % 12;
  if (i === 0) return "sm:col-span-2 sm:row-span-2";
  if (i === 5) return "sm:col-span-2";
  if (i === 9) return "sm:row-span-2";
  return "";
}

export default function GalleryPage() {
  // One representative photo per category (the first cataloged item) for the
  // nav cards below — simplest option; swap any entry's index if a different
  // photo would represent a category better.
  const categoryCards = CATEGORIES.map((cat) => ({
    ...cat,
    representative: getGalleryItemsByCategory(cat.value)[0],
    count: getGalleryItemsByCategory(cat.value).length,
  }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Gallery
        </h1>

        {/* Tagline + CTA row */}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Custom hardwood furniture crafted for you and your home.
          </p>

          <Link
            href="/contact"
            className="ui-btn ui-btn-primary w-full text-center sm:w-auto"
          >
            Request a quote
          </Link>
        </div>
      </header>

      {/* Category navigation */}
      <section aria-label="Browse by category" className="mb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categoryCards.map((cat, i) =>
            cat.representative ? (
              <Link
                key={cat.value}
                href={`/gallery/${cat.value}`}
                className={`ui-card group overflow-hidden ${
                  // Avoid a lone orphaned card in the last row of the 2-column
                  // mobile grid when the category count is odd.
                  i === categoryCards.length - 1 && categoryCards.length % 2 === 1
                    ? "col-span-2 sm:col-span-1"
                    : ""
                }`}
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={cat.representative.src}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium">{cat.label}</div>
                  <div
                    className="text-xs"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    {cat.count} {cat.count === 1 ? "project" : "projects"}
                  </div>
                </div>
              </Link>
            ) : null
          )}
        </div>
      </section>

      <section
        aria-label="Custom woodworking gallery"
        className="grid auto-rows-[220px] grid-cols-1 gap-6 sm:grid-cols-3"
      >
        {GALLERY_IMAGES.map((item, idx) => (
          <div
            key={item.id}
            className={[
              "relative overflow-hidden", // clip within cell
              "transition-transform duration-200",
              "hover:z-20", // bring hovered tile above neighbors
              getMosaicSpan(idx),
            ].join(" ")}
          >
            <GalleryCard
              item={item}
              titleOnHover
              fillParent
              scaleOnHover
              href={`/gallery/${item.category}/${item.slug}`}
            />
          </div>
        ))}
      </section>

      <section className="mt-12" aria-label="531 Workshop video">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <iframe
            className="absolute inset-0 h-full w-full"
            src="https://www.youtube-nocookie.com/embed/wQ63sQTePeE?rel=0&modestbranding=1"
            title="531 Workshop"
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>
    </main>
  );
}
