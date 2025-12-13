import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL!);

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
function newToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

export async function createAndStoreToken(email: string, ttlMinutes = 60) {
  const raw = newToken();
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();

  await sql/*sql*/`DELETE FROM app.email_verification_tokens WHERE email = ${email}`;
  await sql/*sql*/`
    INSERT INTO app.email_verification_tokens (email, token_hash, expires_at)
    VALUES (${email}, ${tokenHash}, ${expiresAt})
  `;
  return raw; // return raw token for link
}

export async function consumeToken(rawToken: string) {
  const tokenHash = sha256(rawToken);
  const rows = await sql/*sql*/`
    SELECT email, expires_at
    FROM app.email_verification_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (rows.length === 0) return { ok: false as const, reason: "not_found" };

  const { email, expires_at } = rows[0] as { email: string; expires_at: string };
  if (new Date(expires_at) < new Date()) {
    await sql/*sql*/`DELETE FROM app.email_verification_tokens WHERE token_hash = ${tokenHash}`;
    return { ok: false as const, reason: "expired" };
  }

  await sql/*sql*/`UPDATE app.subscriptions SET verified = TRUE WHERE LOWER(email) = LOWER(${email})`;
  await sql/*sql*/`DELETE FROM app.email_verification_tokens WHERE token_hash = ${tokenHash}`;
  return { ok: true as const, email };
}

// ---- email sending via Resend (sandbox sender works without DNS) ----
export async function sendVerificationEmail(email: string, token: string) {
  const site = process.env.SITE_URL!;
  const from = process.env.EMAIL_FROM!;
  const key = process.env.RESEND_API_KEY!;
  const url = `${site}/newsletter/confirm?token=${encodeURIComponent(token)}`;

  const subject = "Confirm your subscription to 3EF Studio";
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
      <h2>Confirm your subscription</h2>
      <p>Tap the button below to confirm <b>${email}</b>.</p>
      <p><a href="${url}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#5EEAD4;color:#000;text-decoration:none;font-weight:600">Confirm subscription</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
      <p style="color:#6b7280;font-size:12px">This link expires in 60 minutes.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from, to: email, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`);
}
