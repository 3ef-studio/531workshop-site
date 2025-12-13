import Link from "next/link";
import type { Project } from "@/types/project";

export default function ProjectCard({ project }: { project: Project }) {
  const { name, summary, badges = [], status, links, slug } = project;

  // add these colors right below the destructuring
  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400",
    planning: "bg-cyan-500/20 text-cyan-300",
    paused: "bg-amber-500/20 text-amber-300",
    archived: "bg-white/5 text-white/60",
  };

  return (
    <article className="rounded-2xl bg-card shadow-soft border border-white/5 hover:border-white/10 transition p-5 h-full flex flex-col">
      {/* ─── Header badges ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {badges.map((b) => (
          <span
            key={b}
            className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-white/80"
          >
            {b}
          </span>
        ))}

        {/* new colored status badge */}
        {status && (
          <span
            className={`text-[10px] px-2 py-1 rounded-full capitalize ${
              statusColors[status] ?? "bg-white/5 text-white/60"
            }`}
          >
            {status}
          </span>
        )}
      </div>

      {/* ─── Title / summary ─── */}
      <h3 className="text-xl font-semibold">
        <Link
          href={`/projects/${slug}`}
          className="hover:underline underline-offset-2"
        >
          {name}
        </Link>
      </h3>

      {summary && <p className="text-muted-foreground mt-2">{summary}</p>}

      {/* ─── Links ─── */}
      <div className="mt-4 text-sm flex flex-wrap gap-3">
        {links?.ddenewsletter && (
          <Link
            href={links.ddenewsletter}
            className="text-white/80 hover:underline underline-offset-2"
          >
            Weekly Domains Newsletter →
          </Link>
        )}
        {links?.repo && (
          <Link
            href={links.repo}
            className="text-white/80 hover:underline underline-offset-2"
          >
            GitHub →
          </Link>
        )}
        {links?.docs && (
          <Link
            href={links.docs}
            className="text-white/80 hover:underline underline-offset-2"
          >
            Docs →
          </Link>
        )}
        {links?.live && (
          <Link
            href={links.live}
            className="text-white/80 hover:underline underline-offset-2"
          >
            Live →
          </Link>
        )}
      </div>
    </article>
  );
}
