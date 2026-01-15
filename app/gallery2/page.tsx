import GalleryCard from "@/components/GalleryCard";
import { GALLERY_IMAGES } from "@/lib/gallery-data";
import Link from "next/link";

function getMosaicSpan(index: number): string {
  const i = index % 12;
  if (i === 0) return "sm:col-span-2 sm:row-span-2";
  if (i === 5) return "sm:col-span-2";
  if (i === 9) return "sm:row-span-2";
  return "";
}

export default function Gallery2Page() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Gallery
        </h1>
        {/* Tagline + CTA row */}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Custom hardwood furniture crafted for you and your home.
          </p>

          <Link
            href="/contact"
            className="ui-btn ui-btn-primary w-full sm:w-auto text-center"
          >
            Request a quote
          </Link>
        </div>
       
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3 auto-rows-[220px]">
        {GALLERY_IMAGES.map((item, idx) => (
          <div
            key={item.id}
            className={[
              "relative overflow-hidden", // IMPORTANT: clip within cell
              "transition-transform duration-200",
              "hover:z-20",              // bring hovered tile above neighbors
              getMosaicSpan(idx),
            ].join(" ")}
          >
            <GalleryCard item={item} titleOnHover fillParent />
          </div>
        ))}
      </section>

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
    </main>
  );
}
