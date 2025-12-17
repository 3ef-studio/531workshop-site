import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground">
          Tell us a bit about what you’d like to build. We’ll respond as soon as we can.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-5">
        {/* Form */}
        <div className="md:col-span-3">
          <div className="ui-card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>

        {/* Contact info / expectations */}
        <aside className="md:col-span-2 space-y-4">
          <div className="ui-card p-6">
            <h2 className="text-sm font-semibold">Email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <a className="hover:underline" href="mailto:531workshop@gmail.com">
                531workshop@gmail.com
              </a>
            </p>
          </div>

          <div className="ui-card p-6">
            <h2 className="text-sm font-semibold">Phone (optional)</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a phone number if you’d like a call back.
            </p>
          </div>

          <div className="ui-card p-6">
            <h2 className="text-sm font-semibold">Service area</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Chicagoland and surrounding areas.
            </p>
          </div>

          <div className="ui-card p-6">
            <h2 className="text-sm font-semibold">What to include</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>What you’re looking to build</li>
              <li>Rough dimensions (if known)</li>
              <li>Timeline (if any)</li>
              <li>Photos or inspiration links (optional)</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
