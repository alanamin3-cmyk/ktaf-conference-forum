export function registrationCodeFromRestrictedScan(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const queryCode = url.searchParams.get("checkin");
    if (queryCode) return queryCode.trim().toUpperCase();
  } catch {
    // Desk scanners may provide the reference directly instead of a URL.
  }

  const match = trimmed.toUpperCase().match(/KTAF-\d{4}-\d{6}/);
  return match?.[0] || "";
}

export function restrictedCheckInError(error: { code?: string; message?: string }) {
  if (error.code === "42501" || error.message?.includes("KTAF_ATTENDEE_EDITOR_REQUIRED")) {
    return "This account is not permitted to check in attendees.";
  }
  if (error.code === "22023" || error.message?.includes("KTAF_INVALID_REGISTRATION_CODE")) {
    return "The scanner did not provide a valid KTAF registration reference.";
  }
  if (error.code === "P0002" || error.message?.includes("KTAF_ATTENDEE_NOT_ACTIVE")) {
    return "No active attendee was found for that QR code.";
  }
  return "Check-in could not be saved. Please scan again.";
}
