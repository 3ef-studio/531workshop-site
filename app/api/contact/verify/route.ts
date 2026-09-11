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

/** Minimal HTML-escaping for the new free-text/derived fields this route adds. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders the "project context" block for the internal notification email.
 * Only includes lines that actually have a value — never invents content.
 */
function renderProjectContext(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const ctx = raw as ProjectContext;

  const lines: string[] = [];

  if (ctx.galleryTitle) {
    lines.push(`<strong>Inspired by:</strong> ${escapeHtml(ctx.galleryTitle)}`);
  }
  if (ctx.galleryCategory && isGalleryCategory(ctx.galleryCategory)) {
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
        const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
        const subjectName = name ? ` (${name})` : "";

        const projectContextHtml = renderProjectContext(row.project_context);

        await resend.emails.send({
          from,
          to,
          subject: `New verified inquiry — 531 Workshop${subjectName}`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
              <h2 style="margin:0 0 12px;">New verified inquiry</h2>
              <p style="margin:0 0 8px;"><strong>Name:</strong> ${name || "—"}</p>
              <p style="margin:0 0 8px;"><strong>Email:</strong> ${row.email}</p>
              <p style="margin:0 0 16px;"><strong>Phone:</strong> ${row.phone || "—"}</p>
              ${projectContextHtml}
              <p style="margin:0 0 6px;"><strong>Customer message:</strong></p>
              <div style="padding:12px;border:1px solid #ddd;border-radius:12px;white-space:pre-wrap;">
                ${row.message || "—"}
              </div>
              <p style="margin-top:12px;color:#777;font-size:12px;">
                Submitted: ${new Date(row.created_at).toLocaleString()}
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
