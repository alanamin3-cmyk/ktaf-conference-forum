/* global Deno */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import { sendConfirmation } from "../_shared/send-registration-confirmation.ts";
import { createResendHandler } from "./handler.mjs";

const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const handler = createResendHandler({
  client,
  sendConfirmation: (attendee: Parameters<typeof sendConfirmation>[0], key: string) =>
    sendConfirmation(attendee, Deno.env.get("RESEND_API_KEY") || "", key),
  origins: (Deno.env.get("ALLOWED_ORIGINS") || "https://ktaf.krd,https://www.ktaf.krd,http://localhost:3000")
    .split(",").map((origin: string) => origin.trim().replace(/\/+$/, "")).filter(Boolean),
});

export default { fetch: handler };
