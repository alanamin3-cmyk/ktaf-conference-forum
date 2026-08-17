import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  renderRegistrationConfirmationEmail,
  renderRegistrationConfirmationText,
} from "./ktaf-registration-confirmation.mjs";

const sourceDirectory = fileURLToPath(new URL("./", import.meta.url));
const outputDirectory = fileURLToPath(new URL("../preview/", import.meta.url));

const sampleRegistration = {
  fullName: "Dr. Lana Ahmed",
  position: "Specialist Physician",
  city: "Erbil",
  email: "lana.ahmed@example.com",
  registrationId: "KTAF-2026-000124",
  siteUrl: "https://ktaf.krd",
  assetBaseUrl: process.env.KTAF_EMAIL_ASSET_BASE_URL || "https://ktaf.krd",
  year: 2026,
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(
    `${outputDirectory}ktaf_registration-confirmation_email_en_responsive_v01.html`,
    renderRegistrationConfirmationEmail(sampleRegistration),
    "utf8",
  ),
  writeFile(
    `${outputDirectory}ktaf_registration-confirmation_email_en_plain_v01.txt`,
    renderRegistrationConfirmationText(sampleRegistration),
    "utf8",
  ),
]);

console.log(`Generated registration email samples from ${sourceDirectory}`);
