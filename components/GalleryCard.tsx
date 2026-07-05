"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { type GalleryImage } from "@/lib/gallery-data";

type Props = {
  item: GalleryImage;
  aspect?: "square" | "landscape" | "portrait";
  showTitle?: boolean;
  titleOnHover?: boolean;
  scaleOnHover?: boolean;
  fillParent?: boolean;
  detailsOnClick?: boolean;
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
  detailsOnClick = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const title = item.title ?? item.alt;
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  const hasDetails = Boolean(
    item.description ||
      item.materials?.length ||
      item.year ||
      item.dimensions ||
      item.tags?.length,
  );

  const canOpenDetails = detailsOnClick && hasDetails;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  function openDetails() {
    if (canOpenDetails) {
      setIsOpen(true);
    }
  }

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
            {canOpenDetails ? (
              <span className="mt-1 block text-xs font-normal text-white/85">
                Click for details
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div className={`ui-card overflow-hidden group ${fillParent ? "h-full" : ""}`}>
        <div
          className={`relative w-full ${fillParent ? "h-full" : ""}`}
          style={fillParent ? undefined : { aspectRatio: aspectRatio[aspect] }}
        >
          {canOpenDetails ? (
            <button
              type="button"
              className="absolute inset-0 block h-full w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              onClick={openDetails}
              aria-label={`View details for ${title}`}
            >
              {imageContent}
            </button>
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

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          aria-describedby={item.description ? dialogDescriptionId : undefined}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-background shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-video w-full bg-black/10">
              <Image
                src={item.src}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 id={dialogTitleId} className="text-xl font-semibold tracking-tight">
                  {title}
                </h2>

                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-sm hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close project details"
                >
                  Close
                </button>
              </div>

              {item.description ? (
                <p
                  id={dialogDescriptionId}
                  className="text-sm leading-6"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {item.description}
                </p>
              ) : null}

              {item.materials?.length || item.year || item.dimensions ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  {item.materials?.length ? (
                    <div>
                      <dt className="font-medium">Materials</dt>
                      <dd style={{ color: "hsl(var(--muted-foreground))" }}>
                        {item.materials.join(", ")}
                      </dd>
                    </div>
                  ) : null}

                  {item.year ? (
                    <div>
                      <dt className="font-medium">Year</dt>
                      <dd style={{ color: "hsl(var(--muted-foreground))" }}>
                        {item.year}
                      </dd>
                    </div>
                  ) : null}

                  {item.dimensions ? (
                    <div>
                      <dt className="font-medium">Dimensions</dt>
                      <dd style={{ color: "hsl(var(--muted-foreground))" }}>
                        {item.dimensions}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
