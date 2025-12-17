import Link from "next/link";

export default function ShopPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Shop
      </h1>

      <p
        className="mt-4 text-base"
        style={{ color: "hsl(var(--muted-foreground))" }}
      >
        A curated selection of available pieces and made-to-order work.
      </p>

      <div className="mt-10 ui-card p-8">
        <p className="text-sm">
          The online shop is coming soon.
        </p>

        <p
          className="mt-3 text-sm"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          For now, please reach out to discuss availability, custom work,
          or upcoming pieces.
        </p>

        <div className="mt-6">
          <Link href="/contact" className="ui-btn ui-btn-primary">
            Request a quote
          </Link>
        </div>
      </div>
    </main>
  );
}
