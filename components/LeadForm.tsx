// components/LeadForm.tsx
"use client";

import { useState } from "react";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

type Props = {
  source?: string; // e.g., "consulting_page"
  className?: string;
};

type ApiResponse = { ok?: boolean; error?: string };

function isApiResponse(x: unknown): x is ApiResponse {
  return typeof x === "object" && x !== null && ("ok" in x || "error" in x);
}

function trackPlausible(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(name, props ? { props } : undefined);
  }
}

export default function LeadForm({ source = "consulting_page", className }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot (kept hidden)
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || done) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, source, company }),
      });

      const raw: unknown = await res.json().catch(() => ({}));
      const data: ApiResponse = isApiResponse(raw) ? raw : {};

      if (!res.ok || data.ok !== true) {
        const errMsg = typeof data.error === "string" ? data.error : "Failed to submit";
        throw new Error(errMsg);
      }

      trackPlausible("consulting_lead_submit", { source });

      setDone(true);
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      trackPlausible("consulting_lead_error", { source });
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-lg font-medium">Thanks — we’ll follow up shortly ✅</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You’ll get a reply within 1 business day. If it’s urgent, email{" "}
          <a className="underline" href="mailto:subscribe@3ef.studio">subscribe@3ef.studio</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={className ?? "rounded-2xl border border-border bg-card p-5 space-y-4"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">What do you need help with?</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-2"
          rows={5}
          placeholder="Briefly describe your project, timeline, and goals."
        />
      </div>

      {/* Honeypot — hide visually but keep in DOM for bots */}
      <div aria-hidden="true" className="hidden">
        <label>Company</label>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.currentTarget.value)}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-accent px-5 py-2 font-medium text-black shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Request a Session"}
        </button>
        <span className="text-xs text-muted-foreground">
          Typically a 30-min intro call. We’ll reply within 1 business day.
        </span>
      </div>
    </form>
  );
}
