import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          About
        </h1>
        
      </header>

      <section className="grid gap-10 lg:grid-cols-12 lg:items-start">
        {/* Left: text */}
        <div className="lg:col-span-7">
          <div className="prose">
            <p>
              {/* your about copy here */}
              531 Workshop builds custom furniture, shelving, and built-ins with a
              focus on clean lines, durable materials, and a timeless finish.
            </p>

            <p>
              {/* more copy */}
              We work with you to understand your space, your needs, and the look
              you’re aiming for—then design and build a piece that fits.
            </p>

            <ul>
              <li>Custom furniture & built-ins</li>
              <li>Material + finish guidance</li>
              <li>Made to fit your space</li>
            </ul>

            <p>
              {/* closing */}
              If you have a project in mind, we’d love to hear about it.
            </p>
            <p>
              531 Workshop is based in the Chicagoland area and works with clients locally on projects that require design, build, and installation.
            </p>
          </div>
        </div>

        {/* Right: sticky image (desktop) */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <div className="ui-card overflow-hidden">
              <div className="relative aspect-4/5">
                <Image
                  src="/images/projects/Profile-pic-1.webp"
                  alt="Workshop in progress"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
