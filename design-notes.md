# KTAF conference website — design notes

## Design system

- White-led academic and medical presentation with deliberate navy, blue, and restrained red accents.
- Official KTAF horizontal lockup is used in the header without alteration.
- The official vascular-flow pattern is used as the hero signature and a low-opacity supporting motif.
- The supplied official Denk Pharma logo is presented without alteration in a dedicated, secondary-hierarchy sponsor section.
- The sponsor mark is intentionally restrained at 160 px on desktop, 145 px on tablet, and 108 px on small screens.
- Montserrat is requested first in the CSS stack, with approved sans-serif fallbacks when it is unavailable.
- Layout follows a wide 12-column-inspired composition and an 8-point spacing rhythm.
- Hero preserves a large quiet text field and more than 35% meaningful negative space.

## Responsive behavior

- Single-page responsive layout for large desktop, laptop, tablet, and mobile widths.
- Desktop navigation remains visible; tablet and mobile use a compact native-details menu with large, keyboard-reachable links and automatic closing after selection.
- The sticky mobile header is reduced to a single 68–72 px row to preserve valuable screen space.
- Anchor destinations use responsive scroll padding so section titles remain visible below the sticky header.
- Content stacks into one column on narrow screens and preserves the full Vision, Mission, and Goal wording.
- Mobile purpose statements use individual editorial cards; conference details remain a compact 2 × 2 grid.
- The hero flow artwork moves behind quiet lower-page space on narrow screens rather than intersecting the primary title.
- The Denk Pharma mark is restrained to 88 px on small screens and sits in a clearly secondary sponsor card.
- Reduced-motion and increased-contrast user preferences are supported.

## Content status

- Vision, Mission, and Goal are reproduced verbatim from the approved wording.
- The event year (2026), city (Sulaymaniyah), venue (Slemani Rotana), and meeting room (Almas 1) are now confirmed.
- The exact date, complete programme, remaining speakers, and changeable session topics remain explicitly provisional.
- Prof. Dr. Aram Baram Mohammed is introduced as Conference Chairman using his supplied University of Sulaimani profile and photograph.
- Denk Pharma is identified as the exclusive sponsor, as supplied by the user.
- No unsourced speaker credential, statistic, treatment claim, guideline claim, or clinical recommendation has been added.
- Current content is institutional conference copy rather than patient advice. Future scientific programme or treatment content requires appropriate scientific and regulatory review before publication.

## Production

- Editable source: React/TypeScript and CSS.
- Web assets: copied from the KTAF skill’s master asset library; the masters remain untouched.
- Color space: sRGB web output.
- Favicon: official KTAF app icon SVG.
- Sponsor source: `linked-assets/denk-pharma-logo-source.pdf`; web rendition: 1679 × 1679 px sRGB PNG.
- Responsive visual checks completed at 320 × 800, 390 × 844, 768 × 1024, and 1440 × 1000.
- The expanded conference-information and chairman feature was rechecked at 320 px, 390 px, and desktop widths; the document viewport retained zero horizontal scroll at both mobile widths.
- The supplied chairman portrait is rendered at or below its native 323 × 425 px size, with no enlargement beyond the source resolution.
- No browser console warnings or errors were observed during the responsive review.
- The production static export and current rendered-HTML test suite pass.
