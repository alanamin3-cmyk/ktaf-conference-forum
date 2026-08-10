# KTAF conference website — design notes

## Design system

- White-led academic and medical presentation with deliberate navy, blue, and restrained red accents.
- Official KTAF horizontal lockup is used in the header without alteration.
- The official vascular-flow pattern is used as the hero signature and a low-opacity supporting motif.
- Montserrat is requested first in the CSS stack, with approved sans-serif fallbacks when it is unavailable.
- Layout follows a wide 12-column-inspired composition and an 8-point spacing rhythm.
- Hero preserves a large quiet text field and more than 35% meaningful negative space.

## Responsive behavior

- Single-page responsive layout for large desktop, laptop, tablet, and mobile widths.
- Navigation remains visible without JavaScript and uses large, keyboard-reachable links.
- Content stacks into one column on narrow screens and preserves the full Vision, Mission, and Goal wording.
- Reduced-motion and increased-contrast user preferences are supported.

## Content status

- Vision, Mission, and Goal are reproduced verbatim from the approved wording.
- Date, venue, programme, and participation details remain explicitly unconfirmed.
- No speaker, sponsor, statistic, treatment claim, guideline claim, or clinical recommendation has been added.
- Current content is institutional conference copy rather than patient advice. Future scientific programme or treatment content requires appropriate scientific and regulatory review before publication.

## Production

- Editable source: React/TypeScript and CSS.
- Web assets: copied from the KTAF skill’s master asset library; the masters remain untouched.
- Color space: sRGB web output.
- Favicon: official KTAF app icon SVG.
