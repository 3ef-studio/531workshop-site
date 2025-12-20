export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Pool } from "pg";
import { Resend } from "resend";
import crypto from "crypto";

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false },
});

const resend = new Resend(process.env.RESEND_API_KEY);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  // good-enough validation (keep it simple)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function baseUrlFromRequest(req: Request) {
  const envBase = process.env.SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function generateToken() {
  // URL-safe token (no padding)
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactPayload;

    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const emailRaw = (body.email || "").trim();
    const phone = (body.phone || "").trim();
    const message = (body.message || "").trim();

    if (!emailRaw || !isValidEmail(emailRaw)) {
      return NextResponse.json({ ok: false, error: "Please enter a valid email." }, { status: 400 });
    }
    if (!message || message.length < 5) {
      return NextResponse.json({ ok: false, error: "Please enter a short message." }, { status: 400 });
    }

    const email = normalizeEmail(emailRaw);

    const source = "contact";
    const referer = req.headers.get("referer") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // NOTE: In Vercel, client IP is usually forwarded.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert the lead (unverified)
      const leadRes = await client.query<{
        id: string;
      }>(
        `
        INSERT INTO app.leads
          (first_name, last_name, email, phone, message, verified, source, referer, ip, user_agent)
        VALUES
          ($1, $2, $3, $4, $5, FALSE, $6, $7, $8, $9)
        RETURNING id
        `,
        [firstName || null, lastName || null, email, phone || null, message, source, referer || null, ip || null, userAgent || null]
      );

      const leadId = leadRes.rows[0]?.id;
      if (!leadId) throw new Error("Lead insert failed (no id returned).");

      // Create verification token record
      const token = generateToken();
      const tokenHash = hashToken(token);

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      await client.query(
        `
        INSERT INTO app.email_verification_tokens
          (lead_id, email, token_hash, expires_at)
        VALUES
          ($1, $2, $3, $4)
        `,
        [leadId, email, tokenHash, expiresAt]
      );

      await client.query("COMMIT");

      // Send verification email
      const baseUrl = baseUrlFromRequest(req);
      const verifyUrl = `${baseUrl}/api/contact/verify?token=${encodeURIComponent(token)}`;

      const from = process.env.EMAIL_FROM;
      if (!from) {
        // still return ok, but log a clear error
        console.error("Missing RESEND_FROM env var (e.g., '531 Workshop <no-reply@yourdomain.com>').");
        return NextResponse.json({ ok: true, message: "Submitted. Please check your email to confirm." });
      }

      if (!process.env.RESEND_API_KEY) {
        console.error("Missing RESEND_API_KEY env var.");
        return NextResponse.json({ ok: true, message: "Submitted. Please check your email to confirm." });
      }

      await resend.emails.send({
        from,
        to: email,
        subject: "Confirm your request — 531 Workshop",
        html: `
          <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5;">
            <h2 style="margin: 0 0 12px;">Confirm your request</h2>
            <p style="margin: 0 0 12px;">
              Thanks for reaching out to 531 Workshop. Please confirm your request by clicking the button below:
            </p>
            <p style="margin: 18px 0;">
              <a href="${verifyUrl}"
                 style="display:inline-block;padding:10px 14px;border-radius:12px;background:#111;color:#fff;text-decoration:none;">
                Confirm request
              </a>
            </p>
            <p style="margin: 0 0 8px; color:#555;">
              If the button doesn’t work, copy and paste this link:
            </p>
            <p style="margin: 0; color:#555; word-break: break-all;">
              ${verifyUrl}
            </p>
            <p style="margin-top: 18px; color:#777; font-size: 12px;">
              This link expires in 24 hours.
            </p>
          </div>
        `,
      });

      return NextResponse.json({ ok: true, message: "Submitted. Please check your email to confirm." });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
