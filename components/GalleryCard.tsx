import Image from "next/image";
import { type GalleryImage } from "@/lib/gallery-data";

type Props = {
  item: GalleryImage;
  aspect?: "square" | "landscape" | "portrait";
  showTitle?: boolean;
  titleOnHover?: boolean;
  scaleOnHover?: boolean; // ✅ optional
  fillParent?: boolean;
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
  scaleOnHover = false, // ✅ add default
  fillParent = false,
}: Props) {
  const title = item.title ?? item.alt;

  return (
    <div className={`ui-card overflow-hidden group ${fillParent ? "h-full" : ""}`}>
      <div
        className={`relative w-full ${fillParent ? "h-full" : ""}`}
        style={fillParent ? undefined : { aspectRatio: aspectRatio[aspect] }}
      >
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
          <div className="absolute inset-0 z-10 flex items-end bg-black/0 transition-colors duration-200 group-hover:bg-black/45">
            <div className="w-full p-4 text-sm font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {title}
            </div>
          </div>
        ) : null}
      </div>

      {!titleOnHover && showTitle && title ? (
        <div className="p-4">
          <div className="text-sm font-medium">{title}</div>
        </div>
      ) : null}
    </div>
  );
}
