import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20260908200000_limit_attendance_to_100.sql", import.meta.url), "utf8");
const increaseMigration = await readFile(new URL("../supabase/migrations/20260910190000_increase_attendance_to_200.sql", import.meta.url), "utf8");
const form = await readFile(new URL("../app/RegistrationSection.tsx", import.meta.url), "utf8");
const portal = await readFile(new URL("../app/admin/AdminPortal.tsx", import.meta.url), "utf8");

test("preserves the original atomic capacity enforcement", () => {
  assert.match(migration, /check \(seat_limit = 100\)/);
  assert.match(migration, /set occupied = occupied \+ seat_change/);
  assert.match(migration, /occupied \+ seat_change between 0 and seat_limit/);
  assert.match(migration, /after insert or delete or update of registration_status, is_test/);
  assert.match(migration, /KTAF_CAPACITY_FULL/);
});

test("raises the enforced limit to 200 without resetting seats or test exclusions", () => {
  assert.match(increaseMigration, /alter column seat_limit set default 200/);
  assert.match(increaseMigration, /set seat_limit = 200 where id = true/);
  assert.match(increaseMigration, /check \(seat_limit = 200\)/);
  assert.doesNotMatch(increaseMigration, /set occupied|update public\.registrations|drop trigger/i);
});

test("test records default off and capacity changes cannot be made by visitors", () => {
  assert.match(migration, /is_test boolean not null default false/);
  assert.match(migration, /OLD.registration_status = 'registered' and not OLD.is_test/);
  assert.match(migration, /NEW.registration_status = 'registered' and not NEW.is_test/);
  assert.match(migration, /revoke all on public.registration_capacity from public, anon, authenticated, service_role/);
  assert.match(migration, /set search_path = ''/);
  assert.doesNotMatch(migration, /grant update.*is_test/);
});

test("shows a full-registration message and checks availability after a rejected submission", () => {
  assert.match(form, /get_registration_capacity/);
  assert.match(form, /All 200 attendee places have been reserved/);
  assert.match(form, /disabled=\{status.state === "submitting" \|\| isFull\}/);
  assert.match(form, /if \(await registrationIsFull\(\)\)/);
});

test("admin totals exclude tests and exported rows identify them", () => {
  assert.match(portal, /!registration.is_test && registration.registration_status === "registered"/);
  assert.match(portal, /summary.registered\} \/ 200/);
  assert.match(portal, /Test — excluded from capacity/);
  assert.match(portal, /"Record type"/);
});

test("published page states the 200-attendee limit", async () => {
  const html = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  assert.match(html, /Registration is limited to 200 attendees/);
  assert.doesNotMatch(html, /Registration is limited to 100 attendees/);
});
