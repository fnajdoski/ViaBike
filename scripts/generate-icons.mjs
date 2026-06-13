/**
 * Generate the PWA icon set from one source mark (a motorcycle glyph on the
 * RideCost graphite/blue brand background). Run: node scripts/generate-icons.mjs
 *
 * Output (public/): icon-192.png, icon-512.png, icon-512-maskable.png,
 * apple-touch-icon.png. The owner can swap in a custom mark by replacing the
 * source SVG here (or dropping their own PNGs at these paths) and re-running.
 *
 * Maskable + apple icons are full-bleed and opaque (no transparency); the
 * maskable variant scales the glyph into the central safe zone.
 */
import sharp from "sharp";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

/** The brand mark. `scale` shrinks the glyph toward center for safe zones. */
function markSvg(scale = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.4" r="0.78">
      <stop offset="0" stop-color="#1b2634"/>
      <stop offset="0.62" stop-color="#10151c"/>
      <stop offset="1" stop-color="#080b10"/>
    </radialGradient>
    <radialGradient id="glow" cx="0.5" cy="0.52" r="0.5">
      <stop offset="0" stop-color="#3AA0FF" stop-opacity="0.30"/>
      <stop offset="1" stop-color="#3AA0FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <ellipse cx="256" cy="266" rx="186" ry="124" fill="url(#glow)"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <!-- wheels -->
    <g fill="none" stroke="#3AA0FF" stroke-width="18">
      <circle cx="158" cy="344" r="58"/>
      <circle cx="354" cy="344" r="58"/>
    </g>
    <circle cx="158" cy="344" r="11" fill="#EAF1F8"/>
    <circle cx="354" cy="344" r="11" fill="#EAF1F8"/>
    <!-- fork + swingarm + exhaust -->
    <g fill="none" stroke="#EAF1F8" stroke-width="20" stroke-linecap="round" stroke-linejoin="round">
      <path d="M330 232 L354 330"/>
      <path d="M250 300 L158 332"/>
      <path d="M236 300 L330 326"/>
      <path d="M205 318 L150 330"/>
    </g>
    <!-- fuel tank + seat body (filled) -->
    <path d="M168 268 Q176 232 220 226 L292 222 Q318 221 322 236 Q322 258 296 264
             Q268 270 244 266 L210 280 Q182 286 168 268 Z" fill="#EAF1F8"/>
    <!-- front fairing / windscreen wedge -->
    <path d="M318 226 L360 196 Q372 200 368 218 L342 246 Z" fill="#EAF1F8"/>
    <!-- headlight accent -->
    <circle cx="356" cy="210" r="11" fill="#3AA0FF"/>
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, scale: 0.94 },
  { file: "icon-512.png", size: 512, scale: 0.94 },
  { file: "icon-512-maskable.png", size: 512, scale: 0.72 }, // central safe zone
  { file: "apple-touch-icon.png", size: 180, scale: 0.86 },
];

for (const { file, size, scale } of targets) {
  await sharp(Buffer.from(markSvg(scale)))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(PUBLIC, file));
  console.log(`wrote public/${file} (${size}px, scale ${scale})`);
}
