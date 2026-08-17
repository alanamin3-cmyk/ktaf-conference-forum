export type KtafRuntimeConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

declare global {
  interface Window {
    KTAF_CONFIG?: Partial<KtafRuntimeConfig>;
  }
}

export function getKtafRuntimeConfig(): KtafRuntimeConfig | null {
  if (typeof window === "undefined") return null;

  const supabaseUrl = String(window.KTAF_CONFIG?.supabaseUrl ?? "")
    .trim()
    .replace(/\/+$/, "");
  const supabasePublishableKey = String(
    window.KTAF_CONFIG?.supabasePublishableKey ?? "",
  ).trim();

  if (!supabaseUrl || !supabasePublishableKey) return null;

  return { supabaseUrl, supabasePublishableKey };
}
