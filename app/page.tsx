import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-10">
      <Hero />
      {/* Feature Cards */}
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="ui-card p-6">
          <h2 className="text-lg font-semibold">Craftsmanship First</h2>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            A clean layout that lets the work speak. Minimal clutter, strong hierarchy.
          </p>
        </div>

        <div className="ui-card p-6">
          <h2 className="text-lg font-semibold">Optimized Gallery</h2>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Fast-loading images, mobile-first, and built to scale as projects grow.
          </p>
        </div>

        <div className="ui-card p-6">
          <h2 className="text-lg font-semibold">Clear Calls to Action</h2>
          <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Simple paths for visitors: view work, learn the story, request a quote.
          </p>
        </div>
      </section>

      {/* Type + Link Preview */}
      <section className="mt-10 ui-card p-6">
        <h2 className="text-lg font-semibold">Typography & Link Preview</h2>
        <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          Accent color and muted text should feel calm and readable. Here’s a sample{" "}
          <a className="ui-link" href="/gallery">
            gallery link
          </a>{" "}
          in context.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Border + Background</p>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Uses global border token and card/background contrast.
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-semibold">Focus Ring</p>
            <p className="mt-1 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
              Tab onto this{" "}
              <a className="ui-link" href="/contact">
                contact link
              </a>{" "}
              to confirm the ring color feels right.
            </p>
          </div>
        </div>
      </section>
     
     {/* Buttons + Inputs Preview */}
      <section className="mt-10 ui-card p-6">
        <h2 className="text-lg font-semibold">Buttons & Inputs</h2>
        <p
          className="mt-2 text-sm"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          Accent color, borders, radius, and focus ring preview.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Buttons */}
          <div>
            <p className="mb-2 text-sm font-medium">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <button className="ui-btn ui-btn-primary">
                Primary Action
              </button>
              <button className="ui-btn ui-btn-secondary">
                Secondary Action
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <p className="mb-2 text-sm font-medium">Input</p>
            <div className="space-y-3">
              <input
                className="ui-input"
                placeholder="Your email address"
              />
              <input
                className="ui-input"
                placeholder="Disabled input"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-10 text-sm">
        <p style={{ color: "hsl(var(--muted-foreground))" }}>
          Switch themes by changing the import in <code>app/layout.tsx</code>.
        </p>
      </footer>
    </main>
  );
}
