// components/Footer.tsx (replace or extend content)
import Link from "next/link";


export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          © {year} Three Eagles Forge Studio
        </p>
        <div className="flex items-center gap-4">

         
        </div>
      </div>
    </footer>
  );
}
