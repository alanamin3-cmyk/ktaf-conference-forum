# KTAF registration portal — design and production notes

## Experience

- The public form is positioned after conference information and before the sponsor section.
- The primary website action now leads directly to registration.
- Desktop uses a two-column editorial composition: registration guidance on the left and a focused form card on the right.
- Mobile collapses to one column with full-width controls and no horizontal overflow.
- Confirmation presents the attendee’s reference code and accurately distinguishes sent from delayed email delivery.

## Team portal

- Portal URL: `https://ktaf.krd/admin.html`.
- The login screen contains no self-registration route.
- Authentication identifies the user; database row-level security separately verifies the user against `admin_users`.
- Dashboard measures total registrations, registrations today, represented cities, and successfully sent confirmation emails.
- Search covers name, position, city, email, and registration reference.
- Excel export respects the current search filter and produces an `.xlsx` file.

## KTAF identity

- White remains dominant with KTAF Navy `#0D2B45`, Scientific Blue `#1E63B6`, Oxygen Blue `#72B6E6`, Anticoagulant Red `#E63946`, and Clinical Gray `#E6E9EF`.
- The official horizontal logo and vascular-flow motif are used without alteration.
- Montserrat remains the primary Latin typeface with existing approved fallbacks.
- Red is reserved for focal confirmation/status accents and does not carry body copy.

## Security and privacy

- Public visitors can only call the registration Edge Function; they cannot insert directly into the database.
- The Edge Function validates and normalizes input, applies a spam honeypot and completion-time check, prevents duplicate email registrations, and uses a server-side service credential.
- Only approved authenticated accounts can read attendee records.
- Admin inserts, updates, and deletes are denied from the browser.
- Confirmation-email failures are recorded without exposing provider secrets.

## Production configuration

- Supabase production project and database policies are active.
- The registration Edge Function is deployed and accepts only approved website origins.
- `ktaf.krd` email is authenticated with SPF, DKIM, DMARC, and a custom return path.
- The email provider credential is sending-only, limited to `ktaf.krd`, and encrypted in the backend.
- `contact@denkpharma.krd` is the initial approved administrator; public administrator sign-up is disabled.
- Inbound forwarding from `registration@ktaf.krd` to `contact@denkpharma.krd` remains an independent Google Workspace routing check.
