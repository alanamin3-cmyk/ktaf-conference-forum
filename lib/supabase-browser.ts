"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getKtafRuntimeConfig } from "./ktaf-runtime-config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const config = getKtafRuntimeConfig();
  if (!config) return null;

  browserClient = createClient(
    config.supabaseUrl,
    config.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  return browserClient;
}
