/* global Deno */
import QRCode from "npm:qrcode@1.5.4";
import { renderRegistrationConfirmationEmail, renderRegistrationConfirmationText } from "./ktaf-registration-email.ts";

export async function sendConfirmation(
  attendee: {
    fullName: string;
    position: string;
    city: string;
    phoneNumber: string;
    email: string;
    registrationCode: string;
  },
  resendApiKey: string,
  idempotencyKey?: string,
) {
  const siteUrl = Deno.env.get("KTAF_SITE_URL") || "https://ktaf.krd";
  const from =
    Deno.env.get("KTAF_EMAIL_FROM") ||
    "KTAF Registration <registration@ktaf.krd>";
  const replyTo =
    Deno.env.get("KTAF_EMAIL_REPLY_TO") || "registration@ktaf.krd";
  const checkInUrl = `${siteUrl}/admin.html?checkin=${encodeURIComponent(
    attendee.registrationCode,
  )}`;
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 360,
    color: { dark: "#0D2B45", light: "#FFFFFF" },
  });
  const qrContent = qrDataUrl.split(",")[1];

  if (!qrContent) {
    throw new Error("The attendee QR pass could not be generated.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [attendee.email],
      reply_to: replyTo,
      subject: "Registration confirmed — KTAF",
      html: renderRegistrationConfirmationEmail({ ...attendee, siteUrl }),
      text: renderRegistrationConfirmationText({ ...attendee, siteUrl }),
      attachments: [
        {
          content: qrContent,
          filename: `KTAF-pass-${attendee.registrationCode}.png`,
          content_id: "ktaf-registration-qr",
        },
      ],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(
      typeof payload?.message === "string"
        ? payload.message
        : `Email provider returned ${response.status}.`,
    );
  }

  return String(payload?.id || "");
}

