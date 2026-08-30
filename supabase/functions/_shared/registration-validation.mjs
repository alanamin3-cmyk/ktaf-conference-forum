const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9() .-]+$/;

function cleanText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function normalizeRegistrationInput(input, now = Date.now()) {
  const fullName = cleanText(input?.fullName);
  const position = cleanText(input?.position);
  const city = cleanText(input?.city);
  const phoneNumber = cleanText(input?.phoneNumber);
  const email = cleanText(input?.email).toLowerCase();
  const website = cleanText(input?.website);
  const formStartedAt = Number(input?.formStartedAt);

  if (website) {
    return { ok: false, bot: true, message: "Registration received." };
  }

  if (input?.acceptedPrivacy !== true) {
    return {
      ok: false,
      message: "Please confirm the registration data consent statement.",
    };
  }

  if (!Number.isFinite(formStartedAt) || now - formStartedAt < 1500) {
    return {
      ok: false,
      message: "Please review the form and submit it again.",
    };
  }

  if (now - formStartedAt > 86_400_000) {
    return {
      ok: false,
      message: "This form has expired. Please refresh the page and try again.",
    };
  }

  const fields = [
    ["Full name", fullName, 2, 120],
    ["Position", position, 2, 120],
    ["City", city, 2, 100],
  ];

  for (const [label, value, minimum, maximum] of fields) {
    if (value.length < minimum || value.length > maximum) {
      return {
        ok: false,
        message: `${label} must contain between ${minimum} and ${maximum} characters.`,
      };
    }
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const phoneDigits = phoneNumber.replace(/\D/g, "");
  if (
    phoneNumber.length > 25 ||
    !PHONE_PATTERN.test(phoneNumber) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    return { ok: false, message: "Please enter a valid phone number." };
  }

  return {
    ok: true,
    value: { fullName, position, city, phoneNumber, email },
  };
}
