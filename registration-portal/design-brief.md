# KTAF registration portal — design brief

- **Deliverable:** Public attendee registration section plus a protected team dashboard
- **Primary audience:** Healthcare professionals registering for KTAF
- **Team audience:** Approved KTAF organizers who manage attendance
- **Public workflow:** Register → validate → store securely → send personalized confirmation email
- **Team workflow:** Sign in → review/search attendees → monitor email status → download Excel
- **Public fields:** Full name, position, city, email address, and explicit data-use consent
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

## Content constraints

- No conference date, venue, programme, accreditation, or attendance entitlement is invented.
- Registration confirmation records the attendee’s place and submitted details only.
- Attendee information is not exposed in the public site bundle or browser storage.
- Database administrator credentials and email-provider credentials never enter GitHub.
