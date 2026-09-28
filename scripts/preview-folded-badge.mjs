// Render the actual portal badge markup without signing in or checking anyone in.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(process.argv[2] || path.join(root, '../folded-badge-55x90/preview'));
const source = await readFile(path.join(root, 'app/admin/AdminPortal.tsx'), 'utf8');
const badgeSource = source.slice(source.indexOf('function BadgeArtwork('), source.indexOf('export default function AdminPortal'));
const js = ts.transpileModule(badgeSource, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
const Badge = new Function('React', 'formatAttendeeName', 'formatCity', `${js}; return BadgeArtwork;`)(React, value => value, value => value);
const css = (await readFile(path.join(root, 'app/globals.css'), 'utf8')).replace('@import "tailwindcss";', '');
const fixtures = [
  { label: 'Standard name', full_name: 'Alan Amin', position: 'Denk Pharma Manager — Kurdistan', city: 'Sulaymaniyah' },
  { label: 'Multi-line name and position', full_name: 'Awat Mahmood Babakir', position: 'Manager of Chwarta Health Center', city: 'Sulaymaniyah' },
  { label: 'Long name and role', full_name: 'Abdulrahman Mohammed Ibrahim Al-Husseini', position: 'Final year cardiothoracic and vascular surgery board trainee', city: 'Sulaymaniyah' },
  { label: 'Maximum-length input stress test', full_name: 'Alexandria '.repeat(12).slice(0,120), position: 'Consultant cardiovascular medicine and clinical education '.repeat(3).slice(0,120), city: 'Sulaymaniyah '.repeat(9).slice(0,100) },
  { label: 'Unbroken input stress test', full_name: 'W'.repeat(120), position: 'M'.repeat(120), city: 'W'.repeat(100) },
];
await mkdir(out, { recursive: true });
await cp(path.join(root, 'public/brand'), path.join(out, 'brand'), { recursive: true });
const sheets = fixtures.map((f) => {
  const registration = { ...f, registration_code: 'KTAF-2026-000000' };
  return `<section class="proof"><h2>${f.label}</h2><div class="proof-sheet">${renderToStaticMarkup(React.createElement(Badge, {registration}))}${renderToStaticMarkup(React.createElement(Badge, {registration, className:'badge-reverse-face'}))}</div><p>55 × 180 mm · fold at 90 mm</p></section>`;
});
await writeFile(path.join(out, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>KTAF folded badge proof</title><style>${css}
body{padding:32px;background:#eef3f8}.proof-grid{display:flex;flex-wrap:wrap;align-items:start;gap:36px}.proof{width:240px}.proof h2{font:600 14px Arial;min-height:34px}.proof > p{font:12px Arial;margin-top:10px}.proof-sheet{position:relative;width:55mm;height:180mm;display:flex;flex-direction:column;background:white;box-shadow:0 8px 24px #0d2b4518}.proof-sheet::after{content:'';position:absolute;top:90mm;left:0;right:0;border-top:1px dashed #a7b1bc}.proof-sheet .ktaf-name-badge{border:0}
</style></head><body><h1 style="font-size:24px;margin-bottom:12px">KTAF · folded delegate badge</h1><p style="margin-bottom:24px">Single-sided print · 55 × 180 mm paper · fold blank backs together at the centre · final size 55 × 90 mm</p><main class="proof-grid">${sheets.join('')}</main></body></html>`);
console.log(out);
