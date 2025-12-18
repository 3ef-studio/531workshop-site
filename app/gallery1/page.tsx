import GalleryCard from "@/components/GalleryCard";
import { GALLERY_IMAGES } from "@/lib/gallery-data";

export default function Gallery1Page() {
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Gallery Option 1
        </h1>
        <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Clean grid layout (consistent tiles).
        </p>
      </header>

      <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
        {GALLERY_IMAGES.map((item) => (
          <GalleryCard key={item.id} item={item} aspect="landscape" showTitle={true} titleOnHover={false} scaleOnHover/>
        ))}
      </section>
    </main>
  );
}
