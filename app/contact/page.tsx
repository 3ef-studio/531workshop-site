import type { Metadata } from "next";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import { findGalleryProjectBySlug, getCategoryLabel } from "@/lib/gallery-data";

export const metadata: Metadata = {
  // Canonical ignores the ?confirmed / ?error / ?project query variants.
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<{ confirmed?: string; error?: string; project?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const confirmed = sp.confirmed === "1";
  const error = sp.error;

  // Resolve the Gallery project server-side from the slug alone. An
  // unknown/stale slug (bad link, renamed/removed project) simply falls back
  // to the normal contact experience — no error state, nothing broken.
  const project = sp.project ? findGalleryProjectBySlug(sp.project) : undefined;
  const projectTitle = project ? project.title ?? project.alt : undefined;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Contact
        </h1>
        <p className="mt-4 max-w-prose text-base text-muted-foreground">
          Have a project in mind? Tell us a little about what you’re looking for — you don’t
          need every detail figured out. We’ll follow up within 1-2 business days.
        </p>
      </header>

      {project ? (
        <div className="mb-8 ui-card flex max-w-md items-center gap-4 p-4 sm:p-5">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={project.src}
              alt={project.alt}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Interested in something like this?
            </div>
            <div className="mt-1 truncate text-base font-semibold">{projectTitle}</div>
            <div className="text-xs text-muted-foreground">
              {getCategoryLabel(project.category)}
            </div>
          </div>
        </div>
      ) : null}

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

      <section className="grid gap-8 md:grid-cols-3">
        {/* Form */}
        <div className="md:col-span-2">
          <div className="ui-card p-6 sm:p-8">
            <ContactForm projectSlug={project?.slug} initialProjectType={project?.category} />
          </div>
        </div>

        {/* Contact details */}
        <aside className="md:col-span-1">
          <div className="ui-card p-5 sm:p-6">
            <dl className="text-sm">
              <dt className="font-medium">Email</dt>
              <dd className="mt-0.5">
                <a
                  className="text-muted-foreground hover:underline"
                  href="mailto:531workshop@gmail.com"
                >
                  531workshop@gmail.com
                </a>
              </dd>

              <dt className="mt-4 font-medium">Phone</dt>
              <dd className="mt-0.5">
                <a
                  className="text-muted-foreground hover:underline"
                  href="tel:+16306385504"
                >
                  (630) 638-5504
                </a>
              </dd>

              <dt className="mt-4 font-medium">Service area</dt>
              <dd className="mt-0.5 text-muted-foreground">
                Chicagoland and surrounding areas.
              </dd>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  );
}
