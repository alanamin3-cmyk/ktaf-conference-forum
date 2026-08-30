# KTAF entrance check-in station

## One-time event-laptop setup

1. Connect the USB QR-code reader and the 90 × 120 mm badge printer to the laptop.
2. Install the printer’s official driver, load the portrait badge stock, and make that printer the operating system’s default printer.
3. Open `https://ktaf.krd/admin.html` in Google Chrome and sign in with an approved KTAF team account.
4. Scan one test registration. Confirm that the attendee shown in the portal matches the printed badge exactly.
5. Check alignment, margins, name size, and barcode-reader behaviour using the real stock before opening the registration desk.

## Normal desk workflow

1. Leave the cursor in **Scanner input**.
2. Scan the QR code in the attendee’s confirmation email.
3. The portal validates the active registration, records the first check-in time, prepares the KTAF name badge, and opens printing automatically.
4. If a badge is damaged or lost, use **Reprint badge** beside that attendee. The original check-in time is retained and the print count increases.

Cancelled registrations are deliberately stopped before printing. A team member must restore the registration only after the attendance status is confirmed.

## Completely automatic printing

Normal Chrome opens its print window as a safety feature. For a staffed, dedicated conference laptop, start Chrome with its `--kiosk-printing` option so the portal’s print command sends the badge directly to the default printer. Keep that laptop physically supervised and use it only for the KTAF check-in portal.

The production badge size is currently set to the KTAF default of **90 × 120 mm portrait**. If the purchased printer stock is different, update and test the CSS page size before the conference.
