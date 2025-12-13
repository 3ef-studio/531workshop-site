// lib/email/leadConfirm.ts
// Consistent with verify.ts: module-scope Resend client, same FROM handling, html+text, tagged logging.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Keep FROM consistent with verify.ts
const FROM =
  process.env.EMAIL_FROM ||
  "Three Eagles Forge <subscribe@3ef.studio>";

// Optional site URL if you use it in templates
const SITE_URL =
  process.env.SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://3ef.studio";

type LeadConfirmOptions = {
  to: string;
  name?: string | null;
  // If you like parity with verify.ts, you can extend with { replyTo?, cc?, bcc? }
};

export async function sendLeadConfirm({ to, name }: LeadConfirmOptions) {
  const safeName = (name ?? "").trim();
  const greeting = safeName ? `, ${safeName}` : "";

  const subject = "Thanks — we received your message";
  const text = [
    `Thanks${greeting}! We received your message at Three Eagles Forge.`,
    "",
    "I’ll reply within one business day.",
    "",
    `If you need faster feedback, you can email directly: subscribe@3ef.studio`,
    "",
    `— 3EF Studio`,
    SITE_URL,
  ].join("\n");

  const html = /* html */ `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#111">
      <p>Thanks${greeting}! We received your message at <strong>Three Eagles Forge</strong>.</p>
      <p>I’ll reply within one business day.</p>
      <p style="margin-top:12px">
        Need faster feedback?
        <a href="mailto:subscribe@3ef.studio">Email directly</a>.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
      <p style="font-size:13px;color:#666;margin:0">
        3EF Studio • <a href="${SITE_URL}" style="color:#666;text-decoration:underline">${SITE_URL}</a>
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      text,
      html,
    });
    // Match verify.ts logging convention (adjust tag if you use a specific logger)
    console.log("lead_confirm_email_success", { to, id: result?.data?.id });
    return result;
  } catch (err) {
    console.error("lead_confirm_email_error", { to, err });
    // Do not throw — keep parity with verify.ts if it swallows email errors
    return { error: err };
  }
}
