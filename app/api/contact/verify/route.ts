export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { Resend } from "resend";
import crypto from "crypto";
import { getCategoryLabel, isGalleryCategory } from "@/lib/gallery-data";
import { getProjectTypeLabel, getTimeframeLabel } from "@/lib/contactOptions";
import { escapeHtml, emailDocument } from "@/lib/email";

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
 * Resolves the "project context" into label/value pairs — only the fields
 * actually present, never invented. Shared by both the HTML and plain-text
 * renderers below so the "suppress Category when it equals Project type"
 * rule only lives in one place.
 */
function projectContextLines(raw: unknown): { label: string; value: string }[] {
  if (!raw || typeof raw !== "object") return [];
  const ctx = raw as ProjectContext;

  const lines: { label: string; value: string }[] = [];

  if (ctx.galleryTitle) {
    lines.push({ label: "Inspired by", value: ctx.galleryTitle });
  }

  const categoryMatchesProjectType =
    Boolean(ctx.galleryCategory) && ctx.galleryCategory === ctx.projectType;

  if (
    ctx.galleryCategory &&
    isGalleryCategory(ctx.galleryCategory) &&
    !categoryMatchesProjectType
  ) {
    lines.push({ label: "Category", value: getCategoryLabel(ctx.galleryCategory) });
  }

  if (ctx.projectType) {
    const label = getProjectTypeLabel(ctx.projectType);
    if (label) lines.push({ label: "Project type", value: label });
  }
  if (ctx.dimensions) {
    lines.push({ label: "Approx. dimensions", value: ctx.dimensions });
  }
  if (ctx.timeframe) {
    const label = getTimeframeLabel(ctx.timeframe);
    if (label) lines.push({ label: "Timeframe", value: label });
  }

  return lines;
}

function renderProjectContextHtml(lines: { label: string; value: string }[]): string {
  if (lines.length === 0) return "";
  return `
    <div style="margin:0 0 16px;padding:12px;border:1px solid #ddd;border-radius:12px;background:#fafafa;">
      ${lines.map((l) => `<p style="margin:0 0 6px;"><strong>${escapeHtml(l.label)}:</strong> ${escapeHtml(l.value)}</p>`).join("\n")}
    </div>
  `;
}

function renderProjectContextText(lines: { label: string; value: string }[]): string {
  if (lines.length === 0) return "";
  return lines.map((l) => `${l.label}: ${l.value}`).join("\n") + "\n\n";
}

/** A tiny, static HTML page — no user data — shown after a valid token is
 *  looked up, before anything is actually confirmed. See POST below for why
 *  the real work waits for a deliberate form submission rather than this GET. */
function confirmPageHtml(token: string): string {
  const subject = "Confirm your request — 531 Workshop";
  const body = `
    <h1 style="margin:0 0 12px;font-size:20px;">Confirm your request</h1>
    <p style="margin:0 0 20px;color:#555;">
      Click below to confirm your request to 531 Workshop.
    </p>
    <form method="post" action="/api/contact/verify">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <button type="submit" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#111;color:#fff;border:none;font-size:15px;cursor:pointer;">
        Confirm request
      </button>
    </form>
  `;
  return emailDocument(subject, body);
}

/**
 * Read-only token lookup. Deliberately has no side effects: email security
 * gateways (Outlook Safe Links, Proofpoint, Mimecast and similar) and some
 * automated tools visit every link in an inbound email automatically, with
 * no human involved. A bare GET that performs the real verification can't
 * tell that apart from a genuine click — see
 * docs/EMAIL_DELIVERABILITY_DESIGN.md §3.4 and docs/TECHNICAL_DEBT.md for
 * evidence this most likely already happened. The actual confirmation only
 * ever happens in POST, below.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token) {
      return new NextResponse("Missing token.", { status: 400 });
    }

    const tokenHash = hashToken(token);

    const result = await pool.query(
      `
      SELECT 1 FROM app.email_verification_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
      LIMIT 1
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return new NextResponse(
        "This confirmation link is invalid or has expired. Please resubmit the contact form.",
        { status: 400 }
      );
    }

    return new NextResponse(confirmPageHtml(token), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("GET /api/contact/verify error:", err);
    return new NextResponse("Something went wrong verifying your request. Please try again.", { status: 500 });
  }
}

/**
 * Performs the actual confirmation — only reachable by submitting the form
 * on the page GET returns above, i.e. a deliberate action, not a passive
 * link visit.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const token = formData.get("token")?.toString().trim();

    if (!token) {
      return new NextResponse("Missing token.", { status: 400 });
    }

    const tokenHash = hashToken(token);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Atomic claim: exactly one request can ever win this update for a
      // given token, because it's conditioned on `used_at IS NULL` in the
      // same statement that sets it. A second, overlapping confirm attempt
      // for the same token (a double-click, or a scanner racing a genuine
      // click) gets zero rows back here and does nothing further — closing
      // the race where two near-simultaneous requests could previously both
      // send the internal notification (docs/EMAIL_DELIVERABILITY_DESIGN.md
      // §3.6).
      const claim = await client.query<{ token_id: string; lead_id: string }>(
        `
        UPDATE app.email_verification_tokens
        SET used_at = now()
        WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
        RETURNING id AS token_id, lead_id
        `,
        [tokenHash]
      );

      const claimed = claim.rows[0];
      if (!claimed) {
        await client.query("ROLLBACK");
        return new NextResponse(
          "This confirmation link is invalid or has expired. Please resubmit the contact form.",
          { status: 400 }
        );
      }

      const leadRes = await client.query<{
        email: string;
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        message: string | null;
        created_at: string;
        verified: boolean;
        project_context: unknown;
      }>(
        `
        SELECT email, first_name, last_name, phone, message, created_at, verified, project_context
        FROM app.leads
        WHERE id = $1
        `,
        [claimed.lead_id]
      );

      const row = leadRes.rows[0];
      if (!row) throw new Error("Claimed token references a lead that no longer exists.");

      if (!row.verified) {
        await client.query(
          `
          UPDATE app.leads
          SET verified = TRUE, verified_at = now()
          WHERE id = $1
          `,
          [claimed.lead_id]
        );
      }

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
        const subject = `New verified inquiry — 531 Workshop${subjectName}`;

        const displayName = name || "—";
        const displayPhone = row.phone ? formatPhoneForDisplay(row.phone) : "—";
        const displayMessage = row.message ? row.message.trim() : "—";
        const displayTimestamp = formatBusinessTimestamp(row.created_at);
        const contextLines = projectContextLines(row.project_context);

        const bodyHtml = `
          <h2 style="margin:0 0 12px;">New verified inquiry</h2>
          <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(displayName)}</p>
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(row.email)}</p>
          <p style="margin:0 0 16px;"><strong>Phone:</strong> ${escapeHtml(displayPhone)}</p>
          ${renderProjectContextHtml(contextLines)}
          <p style="margin:0 0 6px;"><strong>Customer message:</strong></p>
          <div style="padding:12px;border:1px solid #ddd;border-radius:12px;white-space:pre-wrap;">${escapeHtml(displayMessage)}</div>
          <p style="margin-top:12px;color:#777;font-size:12px;">
            Submitted: ${displayTimestamp}
          </p>
        `;

        // Plain text is NOT HTML-escaped — it's rendered as-is in a
        // non-HTML context, so escaping would show literal "&amp;"-style
        // entities to the recipient.
        const bodyText = `New verified inquiry

Name: ${displayName}
Email: ${row.email}
Phone: ${displayPhone}

${renderProjectContextText(contextLines)}Customer message:
${displayMessage}

Submitted: ${displayTimestamp}
`;

        await resend.emails.send({
          from,
          to,
          subject,
          html: emailDocument(subject, bodyHtml),
          text: bodyText,
          // The customer's own address — already validated by isValidEmail
          // on submission and normalized to lowercase, and a header value
          // rather than HTML, so it isn't escaped here (TECHNICAL_DEBT A12).
          replyTo: row.email,
        });
      } else {
        console.warn("Skipping internal email: missing CONTACT_TO_EMAIL and/or EMAIL_FROM and/or RESEND_API_KEY.");
      }

      // Redirect user to a friendly confirmation state. 303 so the browser
      // follows with a GET rather than re-POSTing the form.
      const redirectTo = new URL("/contact?confirmed=1", new URL(req.url).origin);
      return NextResponse.redirect(redirectTo, 303);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/contact/verify error:", err);
    return new NextResponse("Something went wrong verifying your request. Please try again.", { status: 500 });
  }
}
