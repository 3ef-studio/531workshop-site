export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          About 531 Workshop
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground">
          Thoughtful, well-crafted woodworking built to last.
        </p>
      </header>

      {/* Body */}
      <section className="space-y-8 text-base leading-7">
        <p>
          531 Workshop is a custom woodworking studio focused on building
          furniture and built-ins that feel intentional, functional, and at
          home in the spaces they’re made for.
        </p>

        <p>
          Every project starts with understanding how a piece will be used —
          the room it lives in, the materials that make sense, and the level of
          durability required for everyday life. From there, designs are kept
          clean and honest, with an emphasis on solid construction and careful
          finishing.
        </p>

        <p>
          The work spans custom furniture, shelving, storage solutions, and
          select remodel projects. Whether it’s a single statement piece or a
          built-in designed to fit a specific space, the goal is always the
          same: create something that looks right, works well, and holds up
          over time.
        </p>

        <p>
          531 Workshop is based in the Chicagoland area and works with clients
          locally on projects that require design, build, and installation.
        </p>
      </section>

      {/* Optional values / process section */}
      <section className="mt-14 grid gap-6 sm:grid-cols-3">
        <div className="ui-card p-6">
          <h3 className="text-sm font-semibold">Design-led</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Projects are planned with the space, use, and materials in mind
            from the start.
          </p>
        </div>

        <div className="ui-card p-6">
          <h3 className="text-sm font-semibold">Built to last</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Solid construction, durable finishes, and attention to detail.
          </p>
        </div>

        <div className="ui-card p-6">
          <h3 className="text-sm font-semibold">Custom by nature</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Each piece is made to fit its environment — not pulled from a
            catalog.
          </p>
        </div>
      </section>
    </main>
  );
}
