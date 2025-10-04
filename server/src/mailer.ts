import { Resend } from "resend";

// Lazy client so dotenv/env loading order doesn’t break things
let _resend: Resend | null = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is missing");
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

const MAIL_FROM = process.env.MAIL_FROM || "Black Jack <onboarding@resend.dev>";
const APP_NAME  = process.env.APP_NAME  || "Black Jack";

export async function sendVerificationCode(
  email: string,
  code: string,
  purpose: "signup" | "login"
) {
  const resend = getResend();
  const action  = purpose === "signup" ? "Sign-up" : "Login";
  const subject = `${APP_NAME} ${action} code: ${code}`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:auto">
      <h2 style="margin:0 0 12px">${APP_NAME}</h2>
      <p>Use this ${action.toLowerCase()} code within 5 minutes:</p>
      <div style="font-size:28px;letter-spacing:6px;font-weight:700;margin:12px 0">${code}</div>
      <p style="color:#666">If you didn’t request this, you can ignore this email.</p>
    </div>
  `;

  // Debug log for testing — shows in server terminal
  console.log(`[MAIL] sending code ${code} to ${email} for ${purpose}`);

  const { error } = await resend.emails.send({
    from: MAIL_FROM,
    to: email,
    subject,
    html,
  });

  if (error) {
    console.error("[MAIL] failed to send:", error);
    throw error;
  }

  console.log("[MAIL] email sent successfully");
}
