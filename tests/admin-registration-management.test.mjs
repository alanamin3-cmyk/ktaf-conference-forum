import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portalSource = await readFile(
  new URL("../app/admin/AdminPortal.tsx", import.meta.url),
  "utf8",
);
const migrationSource = await readFile(
  new URL(
    "../supabase/migrations/20260817210000_add_registration_attendance_status.sql",
    import.meta.url,
  ),
  "utf8",
);
const checkinMigrationSource = await readFile(
  new URL(
    "../supabase/migrations/20260830120000_add_phone_and_checkin.sql",
    import.meta.url,
  ),
  "utf8",
);
const globalStyles = await readFile(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

test("uses professional cancellation wording and supports restoration", () => {
  assert.match(portalSource, /Cancelled by attendee/);
  assert.match(portalSource, /Mark cancelled/);
  assert.match(portalSource, /Restore registration/);
  assert.match(portalSource, /cancellation_note/);
});

test("adds phone visibility and a QR scanner check-in station", () => {
  assert.match(portalSource, /phone_number/);
  assert.match(portalSource, /QR check-in &amp; badge printing/);
  assert.match(portalSource, /registrationCodeFromScan/);
  assert.match(portalSource, /window\.print\(\)/);
  assert.match(portalSource, /Check in \+ print/);
});

test("prints a KTAF 90 by 120 millimetre delegate badge", () => {
  assert.match(portalSource, /ktaf-horizontal\.svg/);
  assert.match(portalSource, /className="badge-delegate-band"/);
  assert.match(globalStyles, /size: 90mm 120mm/);
  assert.match(globalStyles, /\.badge-print-sheet/);
  assert.match(globalStyles, /\.badge-name-long/);
});

test("database stores phone, check-in time, and badge print history", () => {
  assert.match(checkinMigrationSource, /phone_number text/);
  assert.match(checkinMigrationSource, /checked_in_at timestamptz/);
  assert.match(checkinMigrationSource, /checked_in_by uuid references auth\.users/);
  assert.match(checkinMigrationSource, /badge_print_count integer/);
  assert.match(checkinMigrationSource, /grant update/);
});

test("protects permanent deletion with registration-reference confirmation", () => {
  assert.match(portalSource, /Delete registration permanently/);
  assert.match(portalSource, /name="confirmationCode"/);
  assert.match(
    portalSource,
    /confirmationCode !== registration\.registration_code/,
  );
  assert.match(portalSource, /tests, duplicates, or\s+mistaken records/);
});

test("database limits status management to authenticated KTAF admins", () => {
  assert.match(migrationSource, /registration_status in \('registered', 'cancelled'\)/);
  assert.match(migrationSource, /for update\s+to authenticated/);
  assert.match(migrationSource, /for delete\s+to authenticated/);
  assert.match(migrationSource, /public\.is_ktaf_admin\(\)/);
  assert.match(migrationSource, /grant delete on public\.registrations/);
});
