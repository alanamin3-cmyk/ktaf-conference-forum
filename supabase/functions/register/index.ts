/* global Deno */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import QRCode from "npm:qrcode@1.5.4";
import {
  renderRegistrationConfirmationEmail,
  renderRegistrationConfirmationText,
} from "../_shared/ktaf-registration-email.ts";
import { normalizeRegistrationInput } from "../_shared/registration-validation.mjs";

const defaultOrigins = [
  "https://ktaf.krd",
  "https://www.ktaf.krd",
  "http://localhost:3000",
];

function allowedOrigins() {
  return (Deno.env.get("ALLOWED_ORIGINS") || defaultOrigins.join(","))
    .split(",")
    .map((origin: string) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function corsHeaders(request: Request) {
  const origin = String(request.headers.get("origin") || "").replace(/\/+$/, "");
  const allowed = allowedOrigins();
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function registrationCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const suffix = String(bytes[0] % 1_000_000).padStart(6, "0");
  return `KTAF-${new Date().getFullYear()}-${suffix}`;
}

async function sendConfirmation(
  attendee: {
    fullName: string;
    position: string;
    city: string;
    phoneNumber: string;
    email: string;
    registrationCode: string;
  },
  resendApiKey: string,
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
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
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

export default {
  async fetch(request: Request) {
  const origin = String(request.headers.get("origin") || "").replace(/\/+$/, "");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== "POST") {
    return json(request, { message: "Method not allowed." }, 405);
  }

  if (!allowedOrigins().includes(origin)) {
    return json(request, { message: "Origin not allowed." }, 403);
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return json(request, { message: "Invalid registration request." }, 400);
  }

  const normalized = normalizeRegistrationInput(input);
  if (!normalized.ok) {
    if (normalized.bot) {
      return json(request, {
        registrationCode: registrationCode(),
        emailSent: true,
      });
    }
    return json(request, { message: normalized.message }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return json(request, { message: "Registration service is not configured." }, 503);
  }

  const database = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const attendee = normalized.value;

  const { data: existing, error: existingError } = await database
    .from("registrations")
    .select(
      "full_name,position,city,phone_number,email,registration_code,email_status",
    )
    .eq("email", attendee.email)
    .maybeSingle();

  if (existingError) {
    console.error("Registration lookup failed", existingError);
    return json(request, { message: "Registration could not be completed." }, 500);
  }

  if (existing?.email_status === "sent") {
    return json(
      request,
      {
        message:
          "This email address is already registered. Please check the inbox for the confirmation email.",
      },
      409,
    );
  }

  let record = existing;
  if (!record) {
    let insertError: { code?: string; message?: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = registrationCode();
      const result = await database
        .from("registrations")
        .insert({
          full_name: attendee.fullName,
          position: attendee.position,
          city: attendee.city,
          phone_number: attendee.phoneNumber,
          email: attendee.email,
          registration_code: code,
        })
        .select(
          "full_name,position,city,phone_number,email,registration_code,email_status",
        )
        .single();

      if (!result.error) {
        record = result.data;
        insertError = null;
        break;
      }

      insertError = result.error;
      if (result.error.code !== "23505") break;
    }

    if (!record) {
      console.error("Registration insert failed", insertError);
      return json(request, { message: "Registration could not be completed." }, 500);
    }
  }

  if (existing) {
    const { data: updatedRecord, error: updateError } = await database
      .from("registrations")
      .update({
        full_name: attendee.fullName,
        position: attendee.position,
        city: attendee.city,
        phone_number: attendee.phoneNumber,
      })
      .eq("registration_code", existing.registration_code)
      .select(
        "full_name,position,city,phone_number,email,registration_code,email_status",
      )
      .single();

    if (updateError || !updatedRecord) {
      console.error("Registration retry update failed", updateError);
      return json(request, { message: "Registration could not be completed." }, 500);
    }
    record = updatedRecord;
  }

  const emailInput = {
    fullName: record.full_name,
    position: record.position,
    city: record.city,
    phoneNumber: record.phone_number,
    email: record.email,
    registrationCode: record.registration_code,
  };

  try {
    const providerId = await sendConfirmation(emailInput, resendApiKey);
    await database
      .from("registrations")
      .update({
        email_status: "sent",
        email_sent_at: new Date().toISOString(),
        email_provider_id: providerId,
        email_error: null,
      })
      .eq("registration_code", record.registration_code);

    return json(
      request,
      { registrationCode: record.registration_code, emailSent: true },
      existing ? 200 : 201,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    console.error("Confirmation email failed", message);
    await database
      .from("registrations")
      .update({ email_status: "failed", email_error: message.slice(0, 500) })
      .eq("registration_code", record.registration_code);

    return json(
      request,
      { registrationCode: record.registration_code, emailSent: false },
      existing ? 200 : 201,
    );
  }
  },
};
