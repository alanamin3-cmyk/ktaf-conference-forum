import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);

async function readRenderedPage() {
  return readFile(new URL("index.html", outputRoot), "utf8");
}

async function readRenderedAdminPage() {
  return readFile(new URL("admin.html", outputRoot), "utf8");
}

test("exports the complete KTAF conference page", async () => {
  const html = await readRenderedPage();

  assert.match(
    html,
    /<title>KTAF \| Kurdistan Thrombosis &amp; Anticoagulation Forum<\/title>/,
  );
  assert.match(html, /id="main-content"/);
  assert.match(html, /id="purpose"/);
  assert.match(html, /id="focus"/);
  assert.match(html, /id="updates"/);
  assert.match(html, /id="sponsor"/);
  assert.match(html, /Advancing Science\. Improving Outcomes\./);
  assert.match(html, /Exclusive sponsor/);
  assert.match(html, /Denk Pharma/);
  assert.match(html, /href="mailto:contact@ktaf\.krd"/);
  assert.match(html, />contact@ktaf\.krd</);
  assert.match(html, /id="register"/);
  assert.match(html, /Attendee registration/);
  assert.match(html, /Confirm registration/);
  assert.match(html, /href="\/admin\.html"/);
  assert.match(html, /Confirmed details, with more to come\./);
  assert.match(html, /Slemani Rotana/);
  assert.match(html, /Almas 1/);
  assert.match(html, /Prof\. Dr\. Aram Baram Mohammed/);
  assert.match(html, /Conference Chairman/);
  assert.match(html, /Conference leadership &amp; faculty/);
  assert.match(html, /Dr\. Dana Omar Karim/);
  assert.match(html, /M\.B\.Ch\.B · Hematology &amp; Lymphoma Specialist/);
  assert.match(html, /Senior Hematologist, Hiwa Hospital/);
  assert.match(html, /University of Sulaimani/);
  assert.match(html, /Dr\. Sarkawt Dawood Abbas/);
  assert.match(html, /Interventional Cardiologist/);
  assert.match(
    html,
    /Atrial Fibrillation in 2026: Correct DOAC Dosing,/,
  );
  assert.match(html, /Subject to programme updates/);
  assert.match(html, /href="#speakers"/);
  assert.match(
    html,
    /href="https:\/\/sites\.google\.com\/a\/univsul\.edu\.iq\/aram-baram\/academic-profile"/,
  );
  assert.match(
    html,
    /href="https:\/\/smarthealth\.group\/ar\/doctor-profile\/113"/,
  );
  assert.match(
    html,
    /href="https:\/\/www\.linkedin\.com\/in\/dana-omar-a8b47534\/"/,
  );
  assert.match(
    html,
    /href="https:\/\/www\.facebook\.com\/Dr\.Sarkawt\.Dawood\.clinic"/,
  );
});

test("includes keyboard and mobile navigation", async () => {
  const html = await readRenderedPage();

  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /aria-label="Primary navigation"/);
  assert.match(html, /class="mobile-nav"/);
  assert.match(html, /aria-label="Mobile navigation"/);
  assert.match(html, /href="#purpose"/);
  assert.match(html, /href="#focus"/);
  assert.match(html, /href="#updates"/);
  assert.match(html, /href="#sponsor"/);
});

test("ships the required public brand assets", async () => {
  await Promise.all([
    access(new URL("brand/ktaf-horizontal.svg", outputRoot)),
    access(new URL("brand/ktaf-compact.svg", outputRoot)),
    access(new URL("brand/ktaf-flow-pattern.svg", outputRoot)),
    access(new URL("brand/ktaf-monochrome-white.svg", outputRoot)),
    access(new URL("brand/sponsors/denk-pharma-logo.png", outputRoot)),
    access(
      new URL(
        "brand/email/ktaf_registration-confirmation_banner_en_1200x400_v01.png",
        outputRoot,
      ),
    ),
    access(new URL("ktaf-config.js", outputRoot)),
    access(new URL("speakers/dr-aram-baram.jpg", outputRoot)),
    access(new URL("speakers/dr-dana-omar-karim.webp", outputRoot)),
    access(new URL("speakers/dr-sarkawt-dawood-abbas.webp", outputRoot)),
  ]);
});

test("exports the protected team registration portal", async () => {
  const html = await readRenderedAdminPage();

  assert.match(html, /<title>Team registration portal \| KTAF<\/title>/);
  assert.match(html, /Protected team area/);
  assert.match(html, /noindex/);
});
