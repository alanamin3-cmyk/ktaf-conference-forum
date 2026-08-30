# KTAF registration portal — design brief

- **Deliverable:** Public attendee registration section plus a protected team dashboard
- **Primary audience:** Healthcare professionals registering for KTAF
- **Team audience:** Approved KTAF organizers who manage attendance
- **Public workflow:** Register → validate → store securely → send personalized confirmation email with a unique check-in QR pass
- **Team workflow:** Sign in → scan QR → verify active registration → record check-in → print badge → manage/search attendees → download Excel
- **Public fields:** Full name, position, city, phone number, email address, and explicit data-use consent
- **Identity:** Kurdistan Thrombosis & Anticoagulation Forum — KTAF
- **Tagline:** Advancing Science. Improving Outcomes.
- **Design mode:** KTAF digital campaign with a white-led clinical interface
- **Responsive target:** 320 px mobile through wide desktop
- **Accessibility:** Keyboard-ready controls, visible focus, semantic labels, live status and error messages
- **Persistence:** Hosted PostgreSQL with row-level security
- **Authentication:** Email/password accounts limited by a separate approved-admin allowlist
- **Email sender:** KTAF Registration `<registration@ktaf.krd>`
- **Reply route:** `registration@ktaf.krd`
- **Export:** Real `.xlsx` workbook containing the currently filtered attendee list
- **Badge stock:** 90 × 120 mm portrait default; confirm the event printer and physical stock before final production
- **Badge content:** Official KTAF identity, full name, professional position, city, registration reference, and Delegate band; no email or phone number

## Content constraints

- The confirmed conference date and venue may be used where already published by KTAF; no accreditation or attendance entitlement is invented.
- Registration confirmation records the attendee’s place, submitted details, and personal check-in QR pass.
- Attendee information is not exposed in the public site bundle or browser storage.
- Database administrator credentials and email-provider credentials never enter GitHub.
- The QR payload contains the registration reference only; attendee details remain protected behind team authentication.
