import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="text-foreground">
      {/* Constrained content */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            About
          </h1>
        </header>

        <section className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: text */}
          <div className="lg:col-span-7">
            <div className="prose dark:prose-invert">
              <p>
                531 Workshop builds custom furniture, shelving, and built-ins with a
                focus on clean lines, durable materials, and a timeless finish.
              </p>

              <p>
                We work with you to understand your space, your needs, and the look
                you’re aiming for—then design and build a piece that fits.
              </p>

              <ul>
                <li>Custom furniture & built-ins</li>
                <li>Material + finish guidance</li>
                <li>Made to fit your space</li>
              </ul>

              <p>If you have a project in mind, we’d love to hear about it.</p>

              <p>
                531 Workshop is based in Villa Park, Illinois and works with clients
                locally on projects that require design, build, and installation.
              </p>
            </div>
          </div>

          {/* Right: sticky image */}
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

        {/* Our Process */}
        <section className="mt-16 prose dark:prose-invert">
          <h2>Our Process</h2>
          <p>
            We believe that great furniture starts with a deep understanding of your needs
            and space...
          </p>

          <div className="relative aspect-video">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Our Process Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <p className="mt-6">
            Watch the video to see our process in action—from initial consultation to
            final installation.
          </p>
        </section>
      </main>

      {/* Full-width carousel (theme-safe) */}
      <section className="mt-16 w-full py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="prose dark:prose-invert">
            <h2>In the Workshop</h2>
            <p>Here is a look inside our workshop, where the magic happens.</p>
          </div>
        </div>

        <div className="not-prose mt-8">
          <div className="flex gap-6 overflow-x-auto px-6 lg:px-12 pb-4">
            {[
              "Working-pic-2.jpg",
              "Puzzle-table-rough-layout.webp",
              "Working-pic-3.jpg",
              "Fireplace-rough-layout-2.webp"
            ].map((img) => (
              <div
                key={img}
                className="shrink-0 w-70 sm:w-90 lg:w-105"
              >
                <div className="relative aspect-3/4 overflow-hidden rounded-xl">
                  <Image
                    src={`/images/projects/${img}`}
                    alt="In the workshop"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
