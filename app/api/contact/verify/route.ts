export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { Resend } from "resend";
import crypto from "crypto";
import { getCategoryLabel, isGalleryCategory } from "@/lib/gallery-data";
import { getProjectTypeLabel, getTimeframeLabel } from "@/lib/contactOptions";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
});

const resend = new Resend(process.env.RESEND_API_KEY);

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type ProjectContext = {
  gallerySlug?: string;
  galleryTitle?: string;
  galleryCategory?: string;
  projectType?: string;
  dimensions?: string;
  timeframe?: string;
};

/**
 * HTML-escaping for every user-supplied or free-text value rendered into the
 * internal notification email (name, email, phone, message, dimensions).
 * Trusted static labels/markup are never passed through this.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Presentation-only phone formatting for the internal email. Never touches
 * the stored value. Recognizes a plain 10-digit US number, or an 11-digit
 * number with a leading US country code (1). Anything else is returned
 * trimmed but otherwise as entered, rather than guessed at.
 */
function formatPhoneForDisplay(rawPhone: string): string {
  const trimmed = rawPhone.trim();
  const digits = trimmed.replace(/\D/g, "");

  let tenDigits: string | null = null;
  if (digits.length === 10) {
    tenDigits = digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    tenDigits = digits.slice(1);
  }

  if (!tenDigits) return trimmed;
  return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
}

/**
 * Formats a stored (UTC) timestamp for the business's local timezone.
 * Uses the IANA tz database via Intl so DST is handled correctly — never
 * calculated manually. Only affects display; the stored timestamp is
 * untouched.
 */
function formatBusinessTimestamp(dateLike: string): string {
  const date = new Date(dateLike);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

/**
 * Renders the "project context" block for the internal notification email.
 * Only includes lines that actually have a value — never invents content.
 * When the Gallery category and the customer-selected Project Type are the
 * same underlying value, the separate Category line is suppressed (showing
 * both would just repeat the same word twice).
 */
function renderProjectContext(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const ctx = raw as ProjectContext;

  const lines: string[] = [];

  if (ctx.galleryTitle) {
    lines.push(`<strong>Inspired by:</strong> ${escapeHtml(ctx.galleryTitle)}`);
  }

  const categoryMatchesProjectType =
    Boolean(ctx.galleryCategory) && ctx.galleryCategory === ctx.projectType;

  if (
    ctx.galleryCategory &&
    isGalleryCategory(ctx.galleryCategory) &&
    !categoryMatchesProjectType
  ) {
    lines.push(`<strong>Category:</strong> ${escapeHtml(getCategoryLabel(ctx.galleryCategory))}`);
  }

  if (ctx.projectType) {
    const label = getProjectTypeLabel(ctx.projectType);
    if (label) lines.push(`<strong>Project type:</strong> ${escapeHtml(label)}`);
  }
  if (ctx.dimensions) {
    lines.push(`<strong>Approx. dimensions:</strong> ${escapeHtml(ctx.dimensions)}`);
  }
  if (ctx.timeframe) {
    const label = getTimeframeLabel(ctx.timeframe);
    if (label) lines.push(`<strong>Timeframe:</strong> ${escapeHtml(label)}`);
  }

  if (lines.length === 0) return "";

  return `
    <div style="margin:0 0 16px;padding:12px;border:1px solid #ddd;border-radius:12px;background:#fafafa;">
      ${lines.map((l) => `<p style="margin:0 0 6px;">${l}</p>`).join("\n")}
    </div>
  `;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token) {
      return new NextResponse("Missing token.", { status: 400 });
    }

    const tokenHash = hashToken(token);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Find a valid, unused, unexpired token
      const tokenRes = await client.query<{
        token_id: string;
        lead_id: string;
        email: string;
        expires_at: string;
        used_at: string | null;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        message: string | null;
        created_at: string;
        verified: boolean;
        project_context: unknown;
      }>(
        `
        SELECT
          evt.id AS token_id,
          evt.lead_id,
          evt.email,
          evt.expires_at,
          evt.used_at,
          l.first_name,
          l.last_name,
          l.phone,
          l.message,
          l.created_at,
          l.verified,
          l.project_context
        FROM app.email_verification_tokens evt
        JOIN app.leads l ON l.id = evt.lead_id
        WHERE evt.token_hash = $1
          AND evt.used_at IS NULL
          AND evt.expires_at > now()
        LIMIT 1
        `,
        [tokenHash]
      );

      const row = tokenRes.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return new NextResponse(
          "This confirmation link is invalid or has expired. Please resubmit the contact form.",
          { status: 400 }
        );
      }

      // If already verified, just mark token used and redirect
      if (!row.verified) {
        await client.query(
          `
          UPDATE app.leads
          SET verified = TRUE, verified_at = now()
          WHERE id = $1
          `,
          [row.lead_id]
        );
      }

      await client.query(
        `
        UPDATE app.email_verification_tokens
        SET used_at = now()
        WHERE id = $1
        `,
        [row.token_id]
      );

      await client.query("COMMIT");

      // Notify client (internal email)
      const to = process.env.CONTACT_TO_EMAIL;
      const from = process.env.EMAIL_FROM;

      if (to && from && process.env.RESEND_API_KEY) {
        // Plain-text name for the subject line — never HTML-escaped, since a
        // subject header isn't HTML and escaping it would show literal
        // "&amp;"-style entities to the recipient's mail client.
        const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
        const subjectName = name ? ` (${name})` : "";

        // Escaped, presentation-formatted values for the HTML body only.
        const displayName = name ? escapeHtml(name) : "—";
        const displayEmail = escapeHtml(row.email);
        const displayPhone = row.phone ? escapeHtml(formatPhoneForDisplay(row.phone)) : "—";
        const displayMessage = row.message ? escapeHtml(row.message.trim()) : "—";
        const displayTimestamp = formatBusinessTimestamp(row.created_at);

        const projectContextHtml = renderProjectContext(row.project_context);

        await resend.emails.send({
          from,
          to,
          subject: `New verified inquiry — 531 Workshop${subjectName}`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
              <h2 style="margin:0 0 12px;">New verified inquiry</h2>
              <p style="margin:0 0 8px;"><strong>Name:</strong> ${displayName}</p>
              <p style="margin:0 0 8px;"><strong>Email:</strong> ${displayEmail}</p>
              <p style="margin:0 0 16px;"><strong>Phone:</strong> ${displayPhone}</p>
              ${projectContextHtml}
              <p style="margin:0 0 6px;"><strong>Customer message:</strong></p>
              <div style="padding:12px;border:1px solid #ddd;border-radius:12px;white-space:pre-wrap;">${displayMessage}</div>
              <p style="margin-top:12px;color:#777;font-size:12px;">
                Submitted: ${displayTimestamp}
              </p>
            </div>
          `,
        });
      } else {
        console.warn("Skipping internal email: missing CONTACT_TO_EMAIL and/or RESEND_FROM and/or RESEND_API_KEY.");
      }

      // Redirect user to a friendly confirmation state
      // You can change this to /contact/confirmed if you create that page.
      const redirectTo = new URL("/contact?confirmed=1", url.origin);
      return NextResponse.redirect(redirectTo, 302);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("GET /api/contact/verify error:", err);
    return new NextResponse("Something went wrong verifying your request. Please try again.", { status: 500 });
  }
}
