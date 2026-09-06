// Run from the website directory: node partnership-logo/center-logo.mjs
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const input = path.join(__dirname, 'source/enhanced-logo.png');
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, top = info.height, right = -1, bottom = -1;
  // Ignore near-white compression/antialiasing noise, not artwork.
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 220) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left) throw new Error('No artwork detected');
  const padding = 80;
  // Keep 2px of edge antialiasing, then add an identical white border.
  const edge = 2;
  const pipeline = sharp(input).extract({
    left: left - edge, top: top - edge,
    width: right - left + 1 + edge * 2,
    height: bottom - top + 1 + edge * 2,
  }).extend({ top: padding - edge, bottom: padding - edge,
    left: padding - edge, right: padding - edge, background: '#ffffff' });
  const output = path.join(__dirname, 'exports/university-of-sulaimani-college-of-medicine.png');
  await pipeline.clone().png().toFile(output);
  await pipeline.clone().webp({ lossless: true }).toFile(path.join(__dirname,
    '../public/brand/partners/university-of-sulaimani-college-of-medicine.webp'));
  console.log(JSON.stringify({ output, width: right - left + 1 + padding * 2,
    height: bottom - top + 1 + padding * 2, margins: { left: padding, right: padding, top: padding, bottom: padding } }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
