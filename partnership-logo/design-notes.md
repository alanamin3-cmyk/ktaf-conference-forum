# Production notes

## Assets and method

Original: `source/supplied-logo.jpeg` (720 × 720). Enhanced raster: `source/enhanced-logo.png` (1774 × 887), created with the built-in image-generation tool in edit mode. This is an enhanced version of the supplied raster, not an official vector master.

Enhancement prompt: “Edit the supplied University of Sulaimani College of Medicine logo image solely for faithful resolution enhancement and cleanup. Produce a high-resolution landscape PNG, about 2400px wide, with tight balanced white margins around the complete horizontal logo lockup (remove the excessive top and bottom white space). Preserve the exact emblem design, mountain/book/tree shapes, ring lettering 'UNIVERSITY OF SULAIMANI', year '1968', original Kurdish lettering beneath the emblem, proportions and all original colors. Preserve the thin red vertical divider and original red serif lettering to its right, exact three-line text 'College' / 'of' / 'Medicine'. Sharpen the lettering next to the logo and the emblem edges, remove JPEG compression blur, use clean flat colors on pure white. This is restoration of the uploaded logo, not a redesign: do not invent details, do not alter or misspell any letter, no new text or marks, no shadows or effects. Keep all content fully visible.”

Image-generation attempts at equal outer spacing did not produce equal borders. The user explicitly approved deterministic cropping and padding. The selected enhancement was then centered using `center-logo.mjs` without changing any artwork pixels. Final PNG and lossless WebP: **1820 × 861**, with **80 px left, right, top and bottom** measured to artwork below the RGB 220 near-white threshold. Two pixels of antialiasing are retained. No stretching or additional generative edits were applied to the selected asset.

## Website

Dedicated academic partnership section above the existing exclusive sponsor section. Desktop: two columns. Mobile below 760 px: stacked copy and centered logo. Logo uses intrinsic aspect ratio, width capped at 480 px (440 px on mobile) and a lossless WebP. The footer links to the new section. No registration/backend changes.

Existing website typography and KTAF colors are inherited. No clinical, treatment, accreditation, or endorsement claims were added beyond the user-supplied partnership.

## Reproduce

From the website directory, with the existing local Sharp dependency available: `node partnership-logo/center-logo.mjs`. The PNG is in `exports/`; the lossless WebP is in `public/brand/partners/`.

## Local verification

- Lint and whitespace checks passed; production build passed; 19 existing tests passed.
- Visually checked at 1280 px desktop, 390 px mobile and 320 px small mobile.
- Document width equals viewport width at each tested size; full partner lockup is visible, loaded at 1820 px natural width, and not distorted.
- Footer partnership link works; KTAF branding and separate Denk Pharma exclusive-sponsor treatment preserved.
