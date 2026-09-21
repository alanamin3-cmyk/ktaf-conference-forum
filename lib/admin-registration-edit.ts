export type EditableAttendee = {
  full_name: string;
  position: string;
  city: string;
  phone_number: string | null;
  email: string;
};

export function validateAttendeeEdit(input: Record<string, unknown>):
  { ok: true; value: EditableAttendee } | { ok: false; message: string } {
  const clean = (value: unknown) => String(value ?? "").trim().replace(/\s+/gu, " ");
  const value: EditableAttendee = {
    full_name: clean(input.full_name), position: clean(input.position), city: clean(input.city),
    phone_number: clean(input.phone_number) || null, email: clean(input.email).toLowerCase(),
  };
  for (const [label, text, max] of [
    ["Full name", value.full_name, 120], ["Position", value.position, 120], ["City", value.city, 100],
  ] as const) {
    if (Array.from(text).length < 2 || Array.from(text).length > max) {
      return { ok: false, message: `${label} must contain between 2 and ${max} characters.` };
    }
  }
  if (value.email.length < 5 || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (value.phone_number) {
    const digits = value.phone_number.replace(/\D/g, "");
    if (value.phone_number.length > 25 || !/^\+?[0-9() .-]+$/.test(value.phone_number) || digits.length < 7 || digits.length > 15) {
      return { ok: false, message: "Enter a valid phone number, or leave it empty if it is not recorded." };
    }
  }
  return { ok: true, value };
}

export function attendeeEditError(error: {code?: string; message?: string}): string {
  if (error.code === "23505") return "That email address is already used by another registration. Review the duplicate records before changing it.";
  if (error.code === "42501") return "Your account could not save attendee details. Please contact the KTAF administrator.";
  return "The details could not be saved. Refresh the list to check the current record before trying again.";
}
