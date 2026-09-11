import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import GalleryCard from "@/components/GalleryCard";
import {
  isGalleryCategory,
  getCategoryLabel,
  getGalleryItemsByCategory,
} from "@/lib/gallery-data";

type Params = { category: string };
type PageProps = { params: Promise<Params> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (!isGalleryCategory(category)) return {};

  const label = getCategoryLabel(category);
  const title = `${label} • 531 Workshop`;
  const description = `Custom ${label.toLowerCase()} built by 531 Workshop.`;

  return {
    title,
    description,
    alternates: { canonical: `/gallery/${category}` },
    openGraph: { title, description, type: "website", url: `/gallery/${category}` },
  };
}

export default async function GalleryCategoryPage({ params }: PageProps) {
  const { category } = await params;
  if (!isGalleryCategory(category)) notFound();

  const label = getCategoryLabel(category);
  const items = getGalleryItemsByCategory(category);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/gallery" className="underline-offset-2 hover:underline">
          Gallery
        </Link>
        <span className="mx-2">/</span>
        <span>{label}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{label}</h1>
        <p className="mt-3 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Custom {label.toLowerCase()} built by 531 Workshop.
        </p>
      </header>

      {items.length > 0 ? (
        <section
          aria-label={`${label} projects`}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              aspect="landscape"
              titleOnHover
              scaleOnHover
              href={`/gallery/${item.category}/${item.slug}`}
            />
          ))}
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nothing in this category yet — check back soon.
        </p>
      )}

      <div className="mt-10">
        <Link href="/gallery" className="ui-link text-sm">
          ← All Gallery
        </Link>
      </div>
    </main>
  );
}
