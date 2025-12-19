// app/faq/page.tsx
import { Metadata } from "next";
import { faqItems } from "@/lib/faq-data";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | 531 Workshop",
  description:
    "Answers to common questions about custom woodworking projects, materials, lead times, and ordering from 531 Workshop.",
};

export default function FaqPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      <h1 className="mb-4 text-3xl font-semibold">
        Frequently Asked Questions
      </h1>

      <p className="mb-10 text-muted-foreground">
        Answers to common questions about custom projects, materials, lead times,
        and ordering. If you don’t see what you’re looking for, feel free to get
        in touch.
      </p>

      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <details
            key={index}
            className="group rounded-lg border border-border bg-background p-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              {item.question}
              <span
                aria-hidden
                className="ml-4 transition-transform duration-200 group-open:rotate-180"
              >
                ▾
              </span>
            </summary>

            <p className="mt-3 text-sm text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
