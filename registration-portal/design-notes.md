# KTAF registration portal — design and production notes

## Experience

- The public form is positioned after conference information and before the sponsor section.
- The primary website action now leads directly to registration.
- Desktop uses a two-column editorial composition: registration guidance on the left and a focused form card on the right.
- Mobile collapses to one column with full-width controls and no horizontal overflow.
- Confirmation presents the attendee’s reference code, explains the entrance workflow, and accurately distinguishes sent from delayed email delivery.
- Phone number uses a native telephone field on mobile and is validated again by the backend.
- The confirmation email embeds a unique QR pass and also attaches the QR image as a fallback.

## Team portal

- Portal URL: `https://ktaf.krd/admin.html`.
- The login screen contains no self-registration route.
- Authentication identifies the user; database row-level security separately verifies the user against `admin_users`.
- Dashboard measures active registrations, check-ins, attendee cancellations, registrations today, and represented cities.
- Search covers name, position, city, phone number, email, registration reference, and attendance status.
- Excel export respects the current search filter and includes phone, check-in, cancellation, and badge-print data in a real `.xlsx` file.
- A dedicated check-in station keeps its scanner input prominent and accepts either the emailed QR URL or a manually typed registration reference.
- Cancelled registrations are blocked from check-in and badge printing. An already checked-in attendee can be reprinted without creating a second check-in time.
- The badge is a 90 × 120 mm KTAF portrait design with the attendee name dominant at arm’s length. It deliberately excludes email and phone number.
- The portal calls the browser print command automatically after a successful scan. Truly silent printing requires Chrome kiosk-printing mode and the badge printer configured as the laptop’s default printer.

## KTAF identity

- White remains dominant with KTAF Navy `#0D2B45`, Scientific Blue `#1E63B6`, Oxygen Blue `#72B6E6`, Anticoagulant Red `#E63946`, and Clinical Gray `#E6E9EF`.
- The official horizontal logo and vascular-flow motif are used without alteration.
- Montserrat remains the primary Latin typeface with existing approved fallbacks.
- Red is reserved for focal confirmation/status accents and does not carry body copy.

## Security and privacy

- Public visitors can only call the registration Edge Function; they cannot insert directly into the database.
- The Edge Function validates and normalizes input, applies a spam honeypot and completion-time check, prevents duplicate email registrations, and uses a server-side service credential.
- Only approved authenticated accounts can read attendee records.
- Only approved authenticated administrators can change attendance status, record check-ins, print badges, or permanently remove test/mistaken records.
- Confirmation-email failures are recorded without exposing provider secrets.

## Production configuration

- Supabase production project and database policies are active.
- The registration Edge Function is deployed and accepts only approved website origins.
- `ktaf.krd` email is authenticated with SPF, DKIM, DMARC, and a custom return path.
- The email provider credential is sending-only, limited to `ktaf.krd`, and encrypted in the backend.
- `contact@denkpharma.krd` is the initial approved administrator; public administrator sign-up is disabled.
- Inbound forwarding from `registration@ktaf.krd` to `contact@denkpharma.krd` remains an independent Google Workspace routing check.
