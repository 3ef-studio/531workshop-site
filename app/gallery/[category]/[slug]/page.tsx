import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  isGalleryCategory,
  getCategoryLabel,
  getGalleryItemBySlug,
} from "@/lib/gallery-data";

type Params = { category: string; slug: string };
type PageProps = { params: Promise<Params> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isGalleryCategory(category)) return {};

  const item = getGalleryItemBySlug(category, slug);
  if (!item) return {};

  const label = getCategoryLabel(category);
  const displayTitle = item.title ?? item.alt;
  const title = `${displayTitle} • 531 Workshop`;
  const description =
    item.description ?? `${displayTitle} — a custom ${label.toLowerCase()} project by 531 Workshop.`;

  return {
    title,
    description,
    alternates: { canonical: `/gallery/${category}/${slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/gallery/${category}/${slug}`,
    },
  };
}

export default async function GalleryProjectPage({ params }: PageProps) {
  const { category, slug } = await params;
  if (!isGalleryCategory(category)) notFound();

  const item = getGalleryItemBySlug(category, slug);
  if (!item) notFound();

  const label = getCategoryLabel(category);
  const displayTitle = item.title ?? item.alt;
  const hasFacts = Boolean(item.materials?.length || item.year || item.dimensions);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16 space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/gallery" className="underline-offset-2 hover:underline">
          Gallery
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/gallery/${category}`} className="underline-offset-2 hover:underline">
          {label}
        </Link>
        <span className="mx-2">/</span>
        <span>{displayTitle}</span>
      </nav>

      <div className="ui-card overflow-hidden">
        <div className="relative w-full aspect-21/9">
          <Image
            src={item.src}
            alt={item.alt}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold">{displayTitle}</h1>

        {item.description ? (
          <p className="text-muted-foreground max-w-2xl">{item.description}</p>
        ) : null}
      </header>

      {hasFacts ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            {item.materials?.length ? (
              <div>
                <dt className="font-medium">Materials</dt>
                <dd className="text-muted-foreground">{item.materials.join(", ")}</dd>
              </div>
            ) : null}

            {item.year ? (
              <div>
                <dt className="font-medium">Year</dt>
                <dd className="text-muted-foreground">{item.year}</dd>
              </div>
            ) : null}

            {item.dimensions ? (
              <div>
                <dt className="font-medium">Dimensions</dt>
                <dd className="text-muted-foreground">{item.dimensions}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className="ui-card p-5 sm:p-6">
        <p className="font-medium">Like this project?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every piece is made to order and can be tailored to your space, style, and needs.
        </p>
        <Link
          href={`/contact?project=${item.slug}`}
          className="ui-btn ui-btn-primary mt-4 inline-block w-full text-center sm:w-auto"
        >
          I want something like this
        </Link>
      </section>

      <div className="flex flex-wrap gap-4 pt-2 text-sm">
        <Link href={`/gallery/${category}`} className="ui-link">
          ← More {label}
        </Link>
        <Link href="/gallery" className="ui-link">
          All Gallery
        </Link>
      </div>
    </main>
  );
}
