import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-6 sm:grid-cols-3">
        {/* Brand */}
        <div>
          <div className="text-sm font-semibold tracking-tight">
            531 Workshop
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Custom woodworking & built-ins. Designed and crafted with care.
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="/gallery1"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Contact / Service area */}
        <div className="text-sm text-muted-foreground">
          <p>Serving the greater Chicagoland area</p>
          <p className="mt-2">
            <a
              href="mailto:hello@531workshop.com"
              className="hover:text-foreground transition-colors"
            >
              hello@531workshop.com
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 text-xs text-muted-foreground flex justify-between">
          <span>© {new Date().getFullYear()} 531 Workshop</span>
          <span>Built with care</span>
        </div>
      </div>
    </footer>
  );
}
