const RESTRICTED_USERNAME_LOGIN = "ktaf-team@accounts.ktaf.krd";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
export function resolvePortalLogin(value: string) {
  const normalized = normalizeUsername(value);

  if (normalized.includes("@")) return normalized;
  if (/^kta?f[\s_-]*team$/.test(normalized)) return RESTRICTED_USERNAME_LOGIN;

  // Use a non-existent address so unknown usernames receive the same generic
  // sign-in error without revealing which portal usernames are valid.
  return "unknown-portal-user@accounts.ktaf.krd";
}
