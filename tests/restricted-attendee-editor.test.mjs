import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { attendeeDirectoryEditError, validateAttendeeDirectoryEdit } from "../lib/attendee-directory-edit.ts";
import { resolvePortalLogin } from "../lib/portal-login.ts";

const migration = await readFile(
  new URL("../supabase/migrations/20260929123000_add_restricted_attendee_editor.sql", import.meta.url),
  "utf8",
);
const component = await readFile(
  new URL("../app/admin/RestrictedAttendeeEditor.tsx", import.meta.url),
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
  assert.match(migration, /returns table \(\s*id uuid,\s*full_name text,\s*position text\s*\)/s);
  assert.match(migration, /set full_name = clean_name,\s*position = clean_position/s);
  assert.match(migration, /registration_status = 'registered'/);
  assert.match(migration, /not r\.is_test/);
  assert.match(migration, /KTAF_ATTENDEE_EDITOR_REQUIRED/);
  assert.match(migration, /insert into public\.attendee_directory_edit_audit/);
  assert.match(migration, /revoke all on public\.attendee_directory_edit_audit from public, anon, authenticated/);
  assert.doesNotMatch(migration, /grant select on public\.registrations.*attendee_editor/i);
});

test("restricted screen has no private contact fields or export controls", () => {
  assert.match(component, /get_ktaf_attendee_directory/);
  assert.match(component, /update_ktaf_attendee_directory_entry/);
  assert.match(component, /onCopy=\{stopRestrictedTransfer\}/);
  assert.match(component, /onPaste=\{stopRestrictedTransfer\}/);
  assert.doesNotMatch(component, /phone_number|registration_code|write-excel-file|Download Excel|mailto:|tel:/);
});
