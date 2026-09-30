import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { attendeeDirectoryEditError, validateAttendeeDirectoryEdit } from "../lib/attendee-directory-edit.ts";
import { resolvePortalLogin } from "../lib/portal-login.ts";
import { registrationCodeFromRestrictedScan, restrictedCheckInError } from "../lib/restricted-checkin.ts";

const migration = await readFile(
  new URL("../supabase/migrations/20260929123000_add_restricted_attendee_editor.sql", import.meta.url),
  "utf8",
);
const component = await readFile(
  new URL("../app/admin/RestrictedAttendeeEditor.tsx", import.meta.url),
  "utf8",
);
const checkinMigration = await readFile(
  new URL("../supabase/migrations/20260930190000_add_restricted_attendee_checkin.sql", import.meta.url),
  "utf8",
);

test("username login accepts KTAF Team without exposing an email field", () => {
  assert.equal(resolvePortalLogin(" KTAF   Team "), "ktaf-team@accounts.ktaf.krd");
  assert.equal(resolvePortalLogin("ADMIN@EXAMPLE.COM"), "admin@example.com");
  assert.match(resolvePortalLogin("unknown"), /unknown-portal-user/);
});

test("restricted edit accepts only a normalized name and position", () => {
  const result = validateAttendeeDirectoryEdit({
    full_name: "  Example   Person ",
    position: "  Specialist   doctor ",
    email: "must-not-pass@example.com",
    phone_number: "+9640000000000",
  });
  assert.deepEqual(result, {
    ok: true,
    value: { full_name: "Example Person", position: "Specialist doctor" },
  });
  assert.equal(validateAttendeeDirectoryEdit({ full_name: "x", position: "Doctor" }).ok, false);
  assert.match(attendeeDirectoryEditError({ code: "42501" }), /not permitted/);
  assert.match(attendeeDirectoryEditError({ code: "P0002" }), /another device/);
});

test("database API returns and updates only name and position", () => {
  assert.match(migration, /returns table \(\s*id uuid,\s*full_name text,\s*"position" text\s*\)/s);
  assert.match(migration, /set full_name = clean_name,\s*position = clean_position/s);
  assert.match(migration, /registration_status = 'registered'/);
  assert.match(migration, /not r\.is_test/);
  assert.match(migration, /KTAF_ATTENDEE_EDITOR_REQUIRED/);
  assert.match(migration, /insert into public\.attendee_directory_edit_audit/);
  assert.match(migration, /revoke all on public\.attendee_directory_edit_audit from public, anon, authenticated/);
  assert.doesNotMatch(migration, /grant select on public\.registrations.*attendee_editor/i);
});

test("restricted screen exposes phone but no email, direct table access or export controls", () => {
  assert.match(component, /get_ktaf_attendee_checkin_directory/);
  assert.match(component, /update_ktaf_attendee_directory_entry/);
  assert.match(component, /phone_number: string \| null/);
  assert.match(component, /Phone number/);
  assert.match(component, /onCopy=\{stopRestrictedTransfer\}/);
  assert.match(component, /onPaste=\{stopRestrictedTransfer\}/);
  assert.doesNotMatch(component, /email:\s*string|write-excel-file|Download Excel|mailto:|tel:/i);
  assert.doesNotMatch(component, /from\(["']registrations["']\)|\.select\(/);
});

test("restricted QR scanner accepts a pass URL or reference", () => {
  assert.equal(
    registrationCodeFromRestrictedScan("https://ktaf.krd/admin.html?checkin=ktaf-2026-123456"),
    "KTAF-2026-123456",
  );
  assert.equal(registrationCodeFromRestrictedScan("scan KTAF-2026-654321 now"), "KTAF-2026-654321");
  assert.equal(registrationCodeFromRestrictedScan("not a KTAF code"), "");
  assert.match(restrictedCheckInError({ code: "P0002" }), /No active attendee/);
});

test("restricted check-in API exposes attendance and phone only, and records the editor", () => {
  assert.match(checkinMigration, /get_ktaf_attendee_checkin_directory/);
  assert.match(checkinMigration, /returns table \(\s*id uuid,\s*full_name text,\s*"position" text,\s*phone_number text,\s*checked_in_at timestamptz\s*\)/s);
  assert.match(checkinMigration, /check_in_ktaf_attendee\(p_registration_code text\)/);
  assert.match(checkinMigration, /set checked_in_at = now\(\),\s*checked_in_by = auth\.uid\(\)/s);
  assert.match(checkinMigration, /registration_status = 'registered'/);
  assert.match(checkinMigration, /not r\.is_test/);
  assert.match(checkinMigration, /grant execute on function public\.check_in_ktaf_attendee\(text\) to authenticated/);
  assert.doesNotMatch(checkinMigration, /returns table \([^)]*(?:email|city|registration_code)/i);
});
