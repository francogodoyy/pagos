import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_xxxxxxxxxxxxx") {
    console.log("[EMAIL DEV] Para:", to, "| Asunto:", subject);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to,
      subject,
      html,
    });
    console.log("[EMAIL OK] Enviado a", to, "-", subject);
  } catch (err) {
    console.error("[EMAIL ERROR]", err);
  }
}
