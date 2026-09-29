export type AttendeeDirectoryEdit = {
  full_name: string;
  position: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}
export function validateAttendeeDirectoryEdit(
  input: Record<string, unknown>,
):
  | { ok: true; value: AttendeeDirectoryEdit }
  | { ok: false; message: string } {
  const value = {
    full_name: clean(input.full_name),
    position: clean(input.position),
  };

  if (value.full_name.length < 2 || value.full_name.length > 120) {
    return { ok: false, message: "Enter a name between 2 and 120 characters." };
  }
  if (value.position.length < 2 || value.position.length > 120) {
    return {
      ok: false,
      message: "Enter a position between 2 and 120 characters.",
    };
  }

  return { ok: true, value };
}

export function attendeeDirectoryEditError(error: {
  code?: string;
  message?: string;
}) {
  if (error.code === "42501") {
    return "This account is not permitted to edit the attendee directory.";
  }
  if (error.code === "P0002") {
    return "This attendee changed on another device. Refresh the list before trying again.";
  }
  return "The change could not be confirmed. Refresh the list before trying again.";
}
