// Non-mutating production checks. Does not create attendees or send emails.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const scope = { window: {} };
runInNewContext(await readFile(new URL('../public/ktaf-config.js', import.meta.url), 'utf8'), scope);
const { supabaseUrl: base, supabasePublishableKey: key } = scope.window.KTAF_CONFIG;
const password = process.env.KTAF_TEAM_PASSWORD;
assert.ok(password, 'Set KTAF_TEAM_PASSWORD for the existing test account.');
const login = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ktaf-team@accounts.ktaf.krd', password }),
});
const session = await login.json();
assert.equal(login.status, 200, 'Restricted account sign-in failed');
const headers = { apikey: key, Authorization: `Bearer ${session.access_token}`, Origin: 'https://ktaf.krd', 'Content-Type': 'application/json' };
async function request(path, body) {
  const r = await fetch(`${base}${path}`, { headers, ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json() };
}
const directory = await request('/rest/v1/rpc/get_ktaf_attendee_checkin_directory', {});
assert.equal(directory.status, 200);
for (const row of directory.data) assert.deepEqual(Object.keys(row).sort(), ['checked_in_at', 'full_name', 'id', 'phone_number', 'position']);
const direct = await request('/rest/v1/registrations?select=id,email&limit=1');
assert.ok(direct.status === 403 || (direct.status === 200 && direct.data.length === 0));
const ready = await request('/functions/v1/resend-registration', { action: 'check' });
assert.equal(ready.status, 200); assert.equal(ready.data.ready, true);
const invalid = await request('/functions/v1/resend-registration', { action: 'register', attendee: { acceptedPrivacy: false } });
assert.equal(invalid.status, 400); assert.match(invalid.data.message, /consent/);
const nonexistent = await request('/functions/v1/resend-registration', { registrationId: '00000000-0000-4000-8000-000000000000' });
assert.equal(nonexistent.status, 404);
const invalidScan = await request('/rest/v1/rpc/check_in_ktaf_attendee', { p_registration_code: 'INVALID' });
assert.equal(invalidScan.data.code, '22023');
const anonymous = await fetch(`${base}/functions/v1/resend-registration`, { method: 'POST', headers: { apikey: key, Origin: 'https://ktaf.krd', 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check' }) });
assert.equal(anonymous.status, 401);
console.log(JSON.stringify({ passed: true, visibleAttendees: directory.data.length, checkedIn: directory.data.filter(r => r.checked_in_at).length, phoneVisible: true, emailsHidden: true, registrationAuthorized: true, emailServiceAuthorized: true, noAttendeesCreated: true, noEmailsSent: true }));
