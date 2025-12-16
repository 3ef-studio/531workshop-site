import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-10 pb-6 sm:pt-14">
      <div className="ui-card overflow-hidden">
        <div className="relative w-full min-h-130 sm:min-h-0 sm:aspect-3/2">
          <Image
            src="/images/projects/Epoxy-River-Coffee-Table-Sycamore.webp"
            alt="Custom woodworking project by 531 Workshop"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />

          {/* Overlay: slightly stronger on mobile */}
          <div className="absolute inset-0 bg-black/45 sm:bg-black/35" />

          {/* Text overlay: centered on mobile, bottom on desktop */}
          <div className="absolute inset-0 flex items-center sm:items-end">
            <div className="w-full p-6 sm:p-10">
              <div className="max-w-2xl">
                <p className="text-sm text-white/85">
                  Custom woodworking • Built-ins • Furniture
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Handcrafted pieces that feel at home.
                </h1>

                {/* Hide long body copy on very small screens */}
                <p className="mt-4 hidden sm:block text-base leading-7 text-white/80">
                  531 Workshop designs and builds custom furniture, shelving, and
                  built-ins—made with durable materials and a clean, timeless style.
                </p>

                {/* Optional short line for mobile */}
                <p className="mt-4 sm:hidden text-base leading-7 text-white/80">
                  Custom builds, made to fit your space.
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

        <div className="px-6 py-4 sm:px-10 text-sm text-muted-foreground">
          Built to fit your space, finished with care.
        </div>
      </div>
    </section>
  );
}
