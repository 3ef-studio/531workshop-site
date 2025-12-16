// components/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          531 Workshop
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/gallery1"
            className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
          >
            Gallery 1
          </Link>
          <Link
            href="/gallery2"
            className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
          >
            Gallery 2
          </Link>
          <Link
            href="/contact"
            className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-card/60 transition-colors"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
