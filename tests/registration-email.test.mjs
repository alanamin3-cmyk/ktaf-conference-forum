import assert from "node:assert/strict";
import test from "node:test";
import {
  registrationEmailDefaults,
  renderRegistrationConfirmationEmail,
  renderRegistrationConfirmationText,
} from "../email-templates/ktaf-registration-confirmation/source/ktaf-registration-confirmation.mjs";

const registration = {
  fullName: "Dr. Lana Ahmed",
  position: "Specialist Physician",
  city: "Erbil",
  phoneNumber: "+964 770 123 4567",
  email: "lana.ahmed@example.com",
  registrationId: "KTAF-2026-000124",
  year: 2026,
};

test("renders a personalized KTAF registration email", () => {
  const html = renderRegistrationConfirmationEmail(registration);

  assert.equal(
    registrationEmailDefaults.from,
    "KTAF Registration <registration@ktaf.krd>",
  );
  assert.equal(registrationEmailDefaults.replyTo, "registration@ktaf.krd");
  assert.match(html, /Kurdistan Thrombosis &amp; Anticoagulation Forum — KTAF/);
  assert.match(html, /Dear Dr\. Lana Ahmed,/);
  assert.match(html, /Specialist Physician/);
  assert.match(html, /Erbil/);
  assert.match(html, /\+964 770 123 4567/);
  assert.match(html, /lana\.ahmed@example\.com/);
  assert.match(html, /KTAF-2026-000124/);
  assert.match(html, /https:\/\/ktaf\.krd\/brand\/email\/ktaf_registration-confirmation_banner_en_1200x400_v01\.png/);
  assert.match(html, /mailto:registration@ktaf\.krd/);
  assert.match(html, /cid:ktaf-registration-qr/);
  assert.match(html, /Present this QR code at the registration desk/);
  assert.doesNotMatch(html, /{{[^}]+}}/);
});

test("escapes attendee-supplied HTML", () => {
  const html = renderRegistrationConfirmationEmail({
    ...registration,
    fullName: '<img src=x onerror="alert(1)">',
  });

  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("renders a useful plain-text fallback", () => {
  const text = renderRegistrationConfirmationText(registration);

  assert.match(text, /REGISTRATION CONFIRMED — KTAF/);
  assert.match(text, /Full name: Dr\. Lana Ahmed/);
  assert.match(text, /Registration reference: KTAF-2026-000124/);
  assert.match(text, /Phone number: \+964 770 123 4567/);
  assert.match(text, /QR code is attached/);
  assert.match(text, /https:\/\/ktaf\.krd\//);
});

test("requires the five registration form fields", () => {
  assert.throws(
    () => renderRegistrationConfirmationEmail({ ...registration, city: "" }),
    /city is required/,
  );
});
