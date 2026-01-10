import ContactForm from "@/components/ContactForm";

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ confirmed?: string; error?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const confirmed = sp.confirmed === "1";
  const error = sp.error;
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground">
          Tell us a bit about what you’d like to build. We’ll respond within 1-2 business days.
        </p>
      </header>
       {confirmed ? (
        <div className="mb-6 ui-card p-4 border border-border">
          <div className="text-sm font-medium">Request confirmed ✅</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Thanks — your request is confirmed and has been sent to 531 Workshop. We’ll be in touch soon.
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 ui-card p-4 border border-red-500/40">
          <div className="text-sm font-medium text-red-600">Confirmation issue</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {error === "expired"
              ? "That confirmation link has expired. Please submit the form again."
              : "That confirmation link is invalid. Please submit the form again."}
          </div>
        </div>
      ) : null}

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
            <h2 className="text-sm font-semibold">Phone</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              (630) 638-5504
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
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
