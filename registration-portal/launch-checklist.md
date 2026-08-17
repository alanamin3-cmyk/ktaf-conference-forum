# KTAF registration portal — launch checklist

Production project: **KTAF Registration** (`jboqxqhryjuwdkkatyyh`)

Deployment status as of 17 August 2026: backend deployed, authenticated email
delivery verified, test attendees removed, public database access denied, and
the initial administrator account approved.

## 1. Supabase project

1. [x] Create the **KTAF Registration** Supabase project.
2. [x] Connect the public project URL and publishable key.
3. [x] Link the local deployment configuration to the production project.
4. [x] Apply `supabase/migrations/20260817180000_create_registration_portal.sql`.
5. [x] Deploy the `register` Edge Function with JWT verification disabled only for this validated public endpoint.
6. [x] Add these encrypted function secrets:
   - `RESEND_API_KEY`
   - `KTAF_EMAIL_FROM=KTAF Registration <registration@ktaf.krd>`
   - `KTAF_EMAIL_REPLY_TO=registration@ktaf.krd`
   - `KTAF_SITE_URL=https://ktaf.krd`
   - `ALLOWED_ORIGINS=https://ktaf.krd,https://www.ktaf.krd`

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function automatically. Never place the service-role key in the website or GitHub repository.

## 2. Website connection

Update `public/ktaf-config.js` with the Supabase project URL and publishable key. The publishable key is intentionally public; row-level security protects the database.

## 3. Team access

1. [x] Create the initial `contact@denkpharma.krd` team account.
2. [x] Add it to the `admin_users` allowlist.
3. [x] Disable public user sign-up.
4. [x] Confirm the public key cannot read attendee records.
5. [ ] Add each additional organizer only after the KTAF team approves their email address.

## 4. Confirmation email

1. [x] Create the Resend account and add `ktaf.krd` as a sending domain.
2. [x] Add the SPF, DKIM, return-path, and DMARC records to 101domain.
3. [x] Verify the sending domain.
4. [x] Create a domain-scoped sending-only API key and store it as an encrypted function secret.
5. [x] Send controlled registrations to a real inbox and verify:
   - sender name and address;
   - personalized attendee details;
   - KTAF banner loads;
   - reply goes to `registration@ktaf.krd`;
   - attendee appears in the team portal.
6. [ ] Independently confirm that a reply to `registration@ktaf.krd` is forwarded by Google Workspace to `contact@denkpharma.krd`.

## 5. Final acceptance

- [x] Run the production build, registration validation tests, HTML tests, and lint.
- [x] Test invalid input, consent, spam, and duplicate-email protections.
- [x] Verify that public visitors cannot read the attendee table.
- [x] Verify real authenticated email delivery to Gmail.
- [ ] Confirm the published site and admin portal use HTTPS after GitHub Pages deploys the new commit.
- [ ] Sign in as the approved administrator and download the first Excel workbook after real registrations arrive.
