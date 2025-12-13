"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

export default function NewsletterForm({ source = "Home Page" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    track("newsletter_subscribe_attempt", { source });
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      track("newsletter_subscribe_success", { source });
    } else {
      track("newsletter_subscribe_error", { source });
      alert("Sorry—couldn’t subscribe right now.");
    }
  }

  if (done) return <p className="text-sm text-muted-foreground">Thanks! You’re on the list.</p>;

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl bg-card px-3 py-2"
      />
      <button disabled={busy} className="rounded-xl px-4 py-2 bg-accent text-black">
        {busy ? "Adding..." : "Subscribe"}
      </button>
    </form>
  );
}
