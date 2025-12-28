import GalleryCard from "@/components/GalleryCard";
import { GALLERY_IMAGES } from "@/lib/gallery-data";

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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Gallery
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Here are some samples of our work.
        </p>
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
    </main>
  );
}
