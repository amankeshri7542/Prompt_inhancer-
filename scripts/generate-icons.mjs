// One-off icon generator. Renders the brand mark to PNGs with sharp.
// Run: node scripts/generate-icons.mjs
//
// The mark is a terminal block caret — the same glyph the app blinks while text
// streams in. Its gradient runs violet → amber, the two surface signals, so the
// icon carries the app's whole colour system in one shape.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'public', 'icons');

const INK = '#0f1015';

const defs = `
  <defs>
    <linearGradient id="caret" x1="150" y1="120" x2="362" y2="392" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8b7cff"/>
      <stop offset="1" stop-color="#f0a73b"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#191b24"/>
      <stop offset="1" stop-color="#0f1015"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#8b7cff" flood-opacity="0.34"/>
    </filter>
  </defs>`;

/** The caret itself, plus the baseline rule it sits on. */
function mark(scale = 1) {
  const w = 104 * scale;
  const h = 236 * scale;
  const x = 256 - w / 2;
  const y = 256 - h / 2 - 12 * scale;
  const r = 14 * scale;

  const ruleW = 188 * scale;
  const ruleY = y + h + 30 * scale;

  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"
          fill="url(#caret)" filter="url(#glow)"/>
    <rect x="${256 - ruleW / 2}" y="${ruleY}" width="${ruleW}" height="${10 * scale}"
          rx="${5 * scale}" fill="#edeef3" opacity="0.16"/>`;
}

// Full-bleed tile (the OS rounds the corners). PWA + apple-touch-icon.
function fullBleed() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${defs}
    <rect width="512" height="512" fill="url(#ground)"/>
    ${mark(1)}
  </svg>`;
}

// Maskable: keep the mark inside the central safe circle.
function maskable() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${defs}
    <rect width="512" height="512" fill="url(#ground)"/>
    ${mark(0.76)}
  </svg>`;
}

// Rounded SVG favicon for the browser tab / app/icon.svg.
function rounded() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${defs}
    <rect width="512" height="512" rx="112" fill="url(#ground)"/>
    <rect width="512" height="512" rx="112" fill="none" stroke="${INK}" stroke-width="2"/>
    ${mark(1)}
  </svg>`;
}

async function png(svg, size, out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(iconsDir, out));
  console.log('wrote', out);
}

await mkdir(iconsDir, { recursive: true });
const full = fullBleed();
await png(full, 192, 'icon-192.png');
await png(full, 512, 'icon-512.png');
await png(full, 180, 'apple-touch-icon.png');
await png(maskable(), 512, 'icon-maskable-512.png');
await png(rounded(), 32, 'favicon-32.png');

// Crisp SVG favicon consumed by app/icon.svg.
await writeFile(join(root, 'app', 'icon.svg'), rounded().trim() + '\n');
console.log('wrote app/icon.svg');
