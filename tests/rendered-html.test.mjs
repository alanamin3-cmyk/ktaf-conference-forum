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
  assert.match(html, /Science, dialogue, and practice: connected\./);
  assert.doesNotMatch(html, /Science, dialogue, and practice—connected\./);
  assert.doesNotMatch(html, /Forum purpose/);
  assert.doesNotMatch(html, /class="shell hero-foot"/);
  assert.match(html, /Exclusive sponsor/);
  assert.match(html, /Denk Pharma/);
  assert.match(html, /href="mailto:contact@ktaf\.krd"/);
  assert.match(html, />contact@ktaf\.krd</);
  assert.match(html, /id="register"/);
  assert.match(html, /Attendee registration/);
  assert.match(html, /Phone number/);
  assert.match(html, /Confirm registration/);
  assert.match(html, /href="\/admin\.html"/);
  assert.match(html, /Confirmed details, with more to come\./);
  assert.match(html, /dateTime="2026-10-01"/);
  assert.match(html, /October 1<sup class="ordinal-suffix">st<\/sup>, 2026/);
  assert.match(html, /Start time/);
  assert.match(html, /09:30/);
  assert.match(html, /Slemani Rotana/);
  assert.match(html, /Almas 1/);
  assert.match(html, /Open in Google Maps/);
  assert.match(
    html,
    /href="https:\/\/maps\.app\.goo\.gl\/J2pwVoMVFj3tdZVR8"/,
  );
  assert.match(html, /Prof\. Dr\. Aram Baram Mohammed/);
  assert.match(html, /Conference Chairman/);
  assert.match(
    html,
    /Anticoagulation Across Specialties—Balancing Thrombosis/,
  );
  assert.match(
    html,
    /Apixaban Across the VTE Continuum: Treatment and Secondary/,
  );
  assert.match(html, /Prevention of DVT and PE/);
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
  assert.match(html, /Dr\. Zana Abdulrahman/);
  assert.match(html, /Asst\. Prof\. of Neurology/);
  assert.match(html, /Kurdistan Council of Medical Specialties/);
  assert.match(html, /Head of the Neurology Department/);
  assert.match(html, /University of Sulaimani/);
  assert.match(html, /Director of the Neurology Department/);
  assert.match(html, /Shar Teaching Hospital/);
  assert.match(html, /Anticoagulation in Stroke patients/);
  assert.match(
    html,
    /href="https:\/\/www\.facebook\.com\/Dr\.ZanaA\/"/,
  );
  assert.doesNotMatch(html, /docs\.google\.com\/spreadsheets/);
});

test("shows Dr. Dana's presentation title without the removed description", async () => {
  const html = await readRenderedPage();
  const profile = html.match(/<article[^>]*aria-labelledby="dana-omar-name"[\s\S]*?<\/article>/)?.[0];
  assert.ok(profile, "Second speaker profile is present");
  const text = profile.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  assert.ok(text.includes("Practical Tips on Anticoagulation"));
  assert.doesNotMatch(profile, /speaker-topic-description/);
  assert.doesNotMatch(text, /An evidence-based review of anticoagulant selection/);
});

test("shows the approved fifth speaker after Dr. Zana with the verified programme title", async () => {
  const html = await readRenderedPage();
  const profiles = [...html.matchAll(/<article[^>]*class="speaker-feature[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(profiles.length, 6);
  assert.match(profiles[3], /aria-labelledby="zana-abdulrahman-name"/);
  const profile = profiles[4];
  assert.match(profile, /aria-labelledby="ahmed-ibrahim-name"/);
  assert.match(profile, /Dr\. Ahmed Ibrahim Shukr/);
  assert.match(profile, /Consultant Hematologist/);
  assert.match(profile, /Kirkuk Center for Oncology and Hematology/);
  assert.match(profile, /Unusual-Site Thrombosis/);
  assert.match(profile, /class="speaker-index"[^>]*>\s*05\s*</);
  assert.match(profile, /<img[^>]*src="\/speakers\/dr-ahmed-ibrahim-shukr\.jpg"[^>]*alt="Dr\. Ahmed Ibrahim Shukr"[^>]*width="1086"[^>]*height="1448"[^>]*loading="lazy"/);
  assert.doesNotMatch(profile, /speaker-bio|speaker-topic-description/);
});

test("shows the approved sixth speaker with the supplied qualifications and role", async () => {
  const html = await readRenderedPage();
  const profiles = [...html.matchAll(/<article[^>]*class="speaker-feature[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(profiles.length, 6);
  assert.match(profiles[4], /aria-labelledby="ahmed-ibrahim-name"/);
  const profile = profiles[5];
  assert.match(profile, /aria-labelledby="mustapha-alkhalidi-name"/);
  assert.match(profile, /speaker-feature-reverse speaker-feature-wide-profile/);
  assert.match(profile, /Ph\. Mustapha Alkhalidi/);
  assert.match(profile, /BSc Pharm, MSc in Pharmaceutics and Industrial Pharmacy/);
  assert.match(profile, /Product Manager, Denk Pharma/);
  assert.match(profile, /class="speaker-index"[^>]*>\s*06\s*</);
  assert.match(profile, /<img[^>]*src="\/speakers\/ph-mustapha-alkhalidi\.jpg"[^>]*alt="Ph\. Mustapha Alkhalidi"[^>]*width="1086"[^>]*height="1448"[^>]*loading="lazy"/);
  assert.doesNotMatch(profile, /speaker-bio|speaker-topic/);
  assert.doesNotMatch(html, /Fernando Guzman/);
});

test("shows the attendee CME credit within the academic partnership section", async () => {
  const html = await readRenderedPage();
  const partnership = html.match(/<section[^>]*id="partnership"[\s\S]*?<\/section>/)?.[0];
  assert.ok(partnership, "Academic partnership section is present");
  assert.match(partnership, /Attendees will receive <strong>1 CME credit<\/strong>\./);
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
    access(new URL("speakers/dr-zana-abdulrahman.webp", outputRoot)),
    access(new URL("speakers/dr-ahmed-ibrahim-shukr.jpg", outputRoot)),
    access(new URL("speakers/ph-mustapha-alkhalidi.jpg", outputRoot)),
  ]);
});

test("exports the protected team registration portal", async () => {
  const html = await readRenderedAdminPage();

  assert.match(html, /<title>Team registration portal \| KTAF<\/title>/);
  assert.match(html, /Protected team area/);
  assert.match(html, /noindex/);
});
