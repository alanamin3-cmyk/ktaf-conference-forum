import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../dist/client/", import.meta.url);

async function readRenderedPage() {
  return readFile(new URL("index.html", outputRoot), "utf8");
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
  ]);
});
