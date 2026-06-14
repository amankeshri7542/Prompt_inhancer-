// One-off icon generator. Renders the brand sparkle to PNGs with sharp.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'public', 'icons');

// 4-point sharp star ("sparkle") centred at (cx,cy) with outer radius R.
function sparkle(cx, cy, R, ratio = 0.16) {
  const i = R * ratio;
  const d = i * Math.SQRT1_2;
  return `M${cx},${cy - R} L${cx + d},${cy - d} L${cx + R},${cy} L${cx + d},${cy + d} L${cx},${cy + R} L${cx - d},${cy + d} L${cx - R},${cy} L${cx - d},${cy - d} Z`;
}

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FFC861"/>
      <stop offset="0.55" stop-color="#F59E2C"/>
      <stop offset="1" stop-color="#E0641A"/>
    </linearGradient>
    <radialGradient id="gloss" cx="0.3" cy="0.24" r="0.85">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.40"/>
      <stop offset="0.55" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#3a1c00" flood-opacity="0.22"/>
    </filter>
  </defs>`;

// Full-bleed tile (OS rounds the corners). Used for PWA + apple-touch-icon.
function fullBleed() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${defs}
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#gloss)"/>
    <path d="${sparkle(256, 256, 150)}" fill="#2A1606" filter="url(#sh)"/>
    <path d="${sparkle(382, 138, 38)}" fill="#FFF4DE" opacity="0.92"/>
  </svg>`;
}

// Maskable: keep the mark inside the central safe circle, no off-centre accent.
function maskable() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${defs}
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#gloss)"/>
    <path d="${sparkle(256, 256, 138)}" fill="#2A1606" filter="url(#sh)"/>
  </svg>`;
}

// Rounded SVG favicon for the browser tab / app/icon.svg.
function rounded() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    ${defs}
    <rect width="512" height="512" rx="112" fill="url(#bg)"/>
    <rect width="512" height="512" rx="112" fill="url(#gloss)"/>
    <path d="${sparkle(256, 256, 150)}" fill="#2A1606" filter="url(#sh)"/>
    <path d="${sparkle(382, 138, 38)}" fill="#FFF4DE" opacity="0.92"/>
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
