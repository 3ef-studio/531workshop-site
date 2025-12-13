import { neon } from "@neondatabase/serverless";
import fs from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";

const sql = neon(process.env.DATABASE_URL!);
const resend = new Resend(process.env.RESEND_API_KEY!);

// Make sure your newsletter signup form uses this value as `source`
const NEWSLETTER_SOURCE =
  process.env.NEWSLETTER_SOURCE ?? "DDE Newsletter";

const FROM_EMAIL =
  process.env.NEWSLETTER_FROM_EMAIL ?? "3EF Studio <newsletter@3ef.studio>";
const SUBJECT =
  process.env.NEWSLETTER_WELCOME_SUBJECT ??
  "Welcome to the 3EF Domain Discovery Top 20";

async function readLatestIssueHtml(): Promise<string | null> {
  try {
    const issuePath = path.join(
      process.cwd(),
      "data",
      "dde",
      "latest",
      "issue.html",
    );
    const html = await fs.readFile(issuePath, "utf8");
    return html;
  } catch (err) {
    console.error("[newsletter] Failed to read latest issue HTML:", err);
    return null;
  }
}

/**
 * After an email is verified, send the latest Top 20 issue
 * ONLY if this subscription is for the DDE newsletter.
 */
export async function sendWelcomeIssueIfNewsletter(email: string) {
  // 1️⃣ Check subscription row (no unsubscribed_at column yet)
  const rows = await sql/* sql */ `
    SELECT source
    FROM app.subscriptions
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;

  if (rows.length === 0) {
    // No subscription row for this email – nothing to do
    return;
  }

  const { source } = rows[0] as { source: string | null };

  // Only proceed if this is explicitly a DDE newsletter subscription
  if (!source || source !== NEWSLETTER_SOURCE) {
    return;
  }

  // 2️⃣ Load latest issue HTML
  const issueHtml = await readLatestIssueHtml();
  if (!issueHtml) {
    console.warn(
      "[newsletter] No latest issue HTML available; skipping welcome issue send.",
    );
    return;
  }

  // 3️⃣ Send the latest Top 20 issue
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: SUBJECT,
      html: issueHtml,
    });
  } catch (err) {
    console.error(
      "[newsletter] Failed to send welcome Top 20 issue after confirmation:",
      err,
    );
  }
}
