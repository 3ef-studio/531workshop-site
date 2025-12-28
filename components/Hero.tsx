import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-0 sm:px-6 pt-4 sm:pt-10">
      {/* Full-bleed on mobile, card on desktop */}
      <div className="overflow-hidden sm:ui-card">
        <div className="relative w-full aspect-9/14 sm:aspect-3/2">
          <Image
            src="/images/projects/Epoxy-River-Coffee-Table-Sycamore.webp"
            alt="Custom woodworking project by 531 Workshop"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />

          {/* Stronger overlay on mobile for legibility */}
          <div className="absolute inset-0 bg-black/50 sm:bg-black/35" />

          {/* Logo watermark (subtle) */}
          <div className="pointer-events-none absolute top-3 right-3 sm:top-6 sm:right-6">
            <div className="relative w-30 h-30 sm:w-45 sm:h-45 opacity-60">
              <Image
                src="/brand/logo-white.png"
                alt=""
                fill
                aria-hidden="true"
                className="object-contain"
                sizes="180px"
              />
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-4 sm:p-10">
              <div className="max-w-2xl">
                <p className="text-xs tracking-wide uppercase text-white/80">
                  Hardwood Cutting Boards
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Crafted for you and your home.
                </h1>

                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
                  Handmade, food safe finishes - elevate your home.
                </p>

                {/* CTAs: stack on mobile so both are visible */}
                <div className="mt-5 grid gap-3 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
                  <Link
                    href="/shop"
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-medium bg-white text-black hover:opacity-90 transition text-center"
                  >
                    Shop
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caption bar only on desktop to keep mobile tight */}
        <div className="hidden sm:block px-10 py-3 text-sm text-muted-foreground">
          Built to fit your space, finished with care.
        </div>
      </div>
    </section>
  );
}
