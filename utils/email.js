import { Resend } from "resend";

let resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_xxxxxxxxxxxxx") {
    console.log("[EMAIL DEV] Para:", to, "| Asunto:", subject);
    return;
  }

  try {
    await getResend().emails.send({
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
