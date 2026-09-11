import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { withPortalTimeout } from "../lib/portal-request.ts";

test("portal requests preserve successful responses, including query thenables", async () => {
  const result = { data: { email: "team@example.com" }, error: null };
  assert.equal(await withPortalTimeout(Promise.resolve(result)), result);
  assert.equal(await withPortalTimeout({ then: (resolve) => resolve(result) }), result);
});

test("unresponsive service produces an error instead of an endless spinner", async () => {
  await assert.rejects(withPortalTimeout(new Promise(() => {}), 10), /timed out/);
});

test("service rejections are propagated", async () => {
  await assert.rejects(withPortalTimeout(Promise.reject(new Error("Unavailable"))), /Unavailable/);
});

test("late responses do not turn a timed-out request into success or retry it", async () => {
  let resolve;
  const request = new Promise((done) => { resolve = done; });
  const bounded = withPortalTimeout(request, 10);
  await assert.rejects(bounded, /timed out/);
  resolve({ data: [] });
  await assert.rejects(bounded, /timed out/);
});

test("portal provides retry without weakening membership checks or clearing credentials", async () => {
  const source = await readFile(new URL("../app/admin/AdminPortal.tsx", import.meta.url), "utf8");
  assert.match(source, /withPortalTimeout\(client\.auth\.getSession\(\)\)/);
  assert.match(source, /if \(membershipError\) throw membershipError/);
  assert.match(source, /if \(!membership\)/);
  assert.match(source, /requestId !== accessRequestRef\.current/);
  assert.match(source, /requestId !== attendeeRequestRef\.current/);
  assert.match(source, /kind === "unavailable"/);
  assert.match(source, /window\.location\.reload\(\)/);
  assert.doesNotMatch(source, /localStorage\.clear\(/);
});
