import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-10 pb-6 sm:pt-14">
      <div className="ui-card overflow-hidden">
        {/* Image canvas */}
        <div className="relative w-full" style={{ aspectRatio: "3 / 2" }}>
          <Image
            src="/images/projects/Epoxy-River-Coffee-Table-Sycamore.webp"
            alt="Custom woodworking project by 531 Workshop"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1200px"
          />

          {/* Subtle dark overlay for legibility (tune as needed) */}
          <div className="absolute inset-0 bg-black/35" />

          {/* Text overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-6 sm:p-10">
              <div className="max-w-2xl">
                <p className="text-sm text-white/80">
                  Custom woodworking • Built-ins • Furniture
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Handcrafted pieces that feel at home.
                </h1>

                <p className="mt-4 text-base leading-7 text-white/80">
                  531 Workshop designs and builds custom furniture, shelving, and
                  built-ins—made with durable materials and a clean, timeless style.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="px-5 py-3 rounded-2xl text-sm font-medium bg-white text-black hover:opacity-90 transition"
                  >
                    Request a quote
                  </Link>

                  <Link
                    href="/gallery1"
                    className="px-5 py-3 rounded-2xl text-sm font-medium border border-white/40 text-white hover:bg-white/10 transition"
                  >
                    View gallery
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optional small caption bar (remove if you want it cleaner) */}
        <div className="px-6 py-4 sm:px-10 text-sm text-muted-foreground">
          Built to fit your space, finished with care.
        </div>
      </div>
    </section>
  );
}
