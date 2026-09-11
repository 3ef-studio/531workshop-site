"use client";

import Image from "next/image";
import Link from "next/link";
import { type GalleryImage } from "@/lib/gallery-data";

type Props = {
  item: GalleryImage;
  aspect?: "square" | "landscape" | "portrait";
  showTitle?: boolean;
  titleOnHover?: boolean;
  scaleOnHover?: boolean;
  fillParent?: boolean;
  /**
   * When provided, the whole tile links to the item's project page.
   * Omit for a plain, non-interactive tile (e.g. /gallery1).
   */
  href?: string;
};

const aspectRatio: Record<NonNullable<Props["aspect"]>, string> = {
  square: "1 / 1",
  landscape: "4 / 3",
  portrait: "3 / 4",
};

export default function GalleryCard({
  item,
  aspect = "landscape",
  showTitle = true,
  titleOnHover = false,
  scaleOnHover = false,
  fillParent = false,
  href,
}: Props) {
  const title = item.title ?? item.alt;

  const imageContent = (
    <>
      <Image
        src={item.src}
        alt={item.alt}
        fill
        className={[
          "object-cover transition-transform duration-300 ease-out",
          scaleOnHover ? "group-hover:scale-[1.03]" : "",
        ].join(" ")}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />

      {titleOnHover && title ? (
        <div className="absolute inset-0 z-10 flex items-end bg-black/0 transition-colors duration-200 group-hover:bg-black/45 group-focus-within:bg-black/45">
          <div className="w-full p-4 text-left text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            {title}
            {href ? (
              <span className="mt-1 block text-xs font-normal text-white/85">
                View project
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <div className={`ui-card overflow-hidden group ${fillParent ? "h-full" : ""}`}>
      <div
        className={`relative w-full ${fillParent ? "h-full" : ""}`}
        style={fillParent ? undefined : { aspectRatio: aspectRatio[aspect] }}
      >
        {href ? (
          <Link
            href={href}
            className="absolute inset-0 block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            aria-label={`View project: ${title}`}
          >
            {imageContent}
          </Link>
        ) : (
          imageContent
        )}
      </div>

      {!titleOnHover && showTitle && title ? (
        <div className="p-4">
          <div className="text-sm font-medium">{title}</div>
        </div>
      ) : null}
    </div>
  );
}
