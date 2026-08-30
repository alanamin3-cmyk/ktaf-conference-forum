import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRegistrationInput } from "../supabase/functions/_shared/registration-validation.mjs";

const now = 1_786_980_000_000;
const validInput = {
  fullName: "  Dr. Lana   Ahmed ",
  position: "Specialist Physician",
  city: "Erbil",
  phoneNumber: "+964 770 123 4567",
  email: "LANA.AHMED@EXAMPLE.COM",
  acceptedPrivacy: true,
  website: "",
  formStartedAt: now - 10_000,
};

test("normalizes a valid attendee registration", () => {
  const result = normalizeRegistrationInput(validInput, now);

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    fullName: "Dr. Lana Ahmed",
    position: "Specialist Physician",
    city: "Erbil",
    phoneNumber: "+964 770 123 4567",
    email: "lana.ahmed@example.com",
  });
});

test("requires a plausible attendee phone number", () => {
  assert.match(
    normalizeRegistrationInput({ ...validInput, phoneNumber: "123" }, now)
      .message,
    /valid phone/i,
  );
  assert.match(
    normalizeRegistrationInput(
      { ...validInput, phoneNumber: "+964 CALL ME" },
      now,
    ).message,
    /valid phone/i,
  );
});

test("requires consent and a valid email address", () => {
  assert.match(
    normalizeRegistrationInput(
      { ...validInput, acceptedPrivacy: false },
      now,
    ).message,
    /consent/i,
  );
  assert.match(
    normalizeRegistrationInput({ ...validInput, email: "invalid" }, now)
      .message,
    /valid email/i,
  );
});

test("detects the hidden spam field", () => {
  const result = normalizeRegistrationInput(
    { ...validInput, website: "https://spam.example" },
    now,
  );

  assert.equal(result.ok, false);
  assert.equal(result.bot, true);
});

test("rejects submissions completed too quickly", () => {
  const result = normalizeRegistrationInput(
    { ...validInput, formStartedAt: now - 400 },
    now,
  );

  assert.equal(result.ok, false);
  assert.match(result.message, /review the form/i);
});
