// lib/email.ts
//
// Shared helpers for the two transactional emails this app sends (the
// customer-facing confirmation and the internal "verified inquiry"
// notification), used by both app/api/contact/route.ts and
// app/api/contact/verify/route.ts. Ported from deliverability lessons
// learned in the Cosmo project — see docs/EMAIL_DELIVERABILITY_DESIGN.md for
// the full design and docs/DECISIONS.md for why each piece was adopted.

/**
 * HTML-escaping for every user-supplied or free-text value rendered into an
 * email. Trusted static labels/markup are never passed through this.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Resolves the base URL used to build links inside outbound emails. Reads
 * SITE_URL and validates it's actually a parseable URL — a malformed value
 * is treated the same as unset, rather than silently producing a broken
 * link or a sender/link domain mismatch (a signal spam filters penalize).
 * Falls back to the incoming request's own origin either way; that fallback
 * is what has been doing the real work in production all along, since
 * SITE_URL has never actually been set there.
 */
export function emailBaseUrl(req: Request): string {
  const envBase = process.env.SITE_URL?.trim();
  if (envBase) {
    try {
      return new URL(envBase).origin;
    } catch {
      // Malformed value — fall through to the request-derived origin below
      // rather than build a broken link from it.
    }
  }
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * Reply-To for the *confirmation* email, if a monitored inbox is configured.
 * Distinct from the internal notification's reply-to, which is always the
 * customer's own address (set directly where that email is built) — this
 * one is for a human at 531 Workshop to receive replies if a customer
 * responds to the confirmation email itself. Omit `EMAIL_REPLY_TO` entirely
 * to leave this email's Reply-To unset.
 */
export function emailReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

/**
 * Wraps an email's body HTML in a complete document (doctype, head, charset,
 * title) instead of a bare fragment. An HTML email with no real document
 * structure at all is one of the more common, easily-avoided spam-filter
 * signals.
 */
export function emailDocument(subject: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px;line-height:1.5;">
${bodyHtml}
</div>
</body>
</html>`;
}
