// server/src/mailer.ts
import { Resend } from "resend";

/** Lazy-initialize the Resend client so env loading order never bites us. */
let _resend: Resend | null = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is missing");
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

/** Get a VERIFIED sender address as a definite string (fixes TS 'string | undefined'). */
const FROM: string = (() => {
  const v = process.env.MAIL_FROM;
  if (!v) {
    throw new Error(
      "MAIL_FROM is missing. Set a verified sender, e.g. 'Black Jack <noreply@your-domain.com>'"
    );
  }
  return v;
})();

/** Optional flags / names */
const MAIL_DRY_RUN = process.env.MAIL_DRY_RUN === "1"; // set to "1" to log instead of sending
const APP_NAME = process.env.APP_NAME || "Black Jack";

/**
 * Send a 6-digit verification code for signup/login.
 * Adds both HTML and plain-text bodies for better deliverability.
 */
export async function sendVerificationCode(
  email: string,
  code: string,
  purpose: "signup" | "login"
) {
  const resend = getResend();
  const action = purpose === "signup" ? "Sign-up" : "Login";
  const subject = `${APP_NAME} ${action} code: ${code}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 12px">${APP_NAME}</h2>
      <p>Use this ${action.toLowerCase()} code within 5 minutes:</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;margin:12px 0">${code}</div>
      <p style="color:#666">If you didn’t request this, you can ignore this email.</p>
    </div>
  `;

  const text =
    `${APP_NAME}\n\n` +
    `${action} code: ${code}\n\n` +
    `Use this code within 5 minutes. If you didn’t request this, you can ignore this email.`;

  console.log(`[MAIL] sending code ${code} to ${email} for ${purpose}`);

  if (MAIL_DRY_RUN) {
    console.log("[MAIL] DRY RUN enabled — email not sent");
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,   // <- FROM is guaranteed string
    to: email,
    subject,
    html,
    text,
    // Remove if your Resend SDK version doesn’t support tags:
    tags: [{ name: "purpose", value: purpose }],
  });

  if (error) {
    console.error("[MAIL] failed to send:", error);
    throw error;
  }

  console.log("[MAIL] email sent successfully");
}
