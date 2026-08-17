# KTAF registration-confirmation email — design notes

## Design system

- White-led clinical composition with KTAF Navy `#0D2B45`, Scientific Blue `#1E63B6`, Oxygen Blue `#72B6E6`, Anticoagulant Red `#E63946`, and Clinical Gray `#E6E9EF`.
- The 1200 × 400 px banner uses the official horizontal-tagline logo and official vascular-flow motif copied from the repository-scoped KTAF brand skill.
- Red is limited to a restrained accent rule and confirmation marker.
- Montserrat is requested first, with Arial and sans-serif email-safe fallbacks.
- The body uses a 640 px table layout, inline styles, a hidden preheader, Outlook-safe structure, and a single-column mobile treatment.

## Message architecture

1. Branded KTAF banner.
2. Immediate confirmation statement.
3. Personalized greeting and reservation acknowledgement.
4. Structured attendee-detail summary.
5. Website call-to-action.
6. Reply guidance and restrained sponsor acknowledgement.

## Production integration

- Renderer: `source/ktaf-registration-confirmation.mjs`.
- Recommended subject: `Registration confirmed — KTAF`.
- Recommended sender: `KTAF Registration <registration@ktaf.krd>`.
- Recommended reply-to: `registration@ktaf.krd`; verify its forwarding rule to `contact@denkpharma.krd` before launch.
- Production banner URL: `https://ktaf.krd/brand/email/ktaf_registration-confirmation_banner_en_1200x400_v01.png`.
- The registration backend must call the renderer and send the returned HTML and text through the selected transactional-email provider.
- Sender-domain SPF/DKIM configuration must be completed for the selected provider before live sending.

## Content status

- Date, venue, programme, speakers, accreditation, and attendance conditions are intentionally omitted because they have not been confirmed.
- No medical claim, statistic, guideline statement, speaker credential, or patient-facing advice is included.
