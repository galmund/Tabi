import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PUBLIC = fileURLToPath(new URL("../public/", import.meta.url));
const SIZE = 1024;
const RADIUS = 0.2237 * SIZE;

const f = (n) => +n.toFixed(2);
function squirclePath(size, r) {
  const k = [1.52866483, 1.08849323, 0.86840689, 0.63149399, 0.074911, 0.37282392, 0.16905767];
  const [a, b, c, d, e, g, h] = k.map((v) => v * r);
  const s = size;
  return [
    `M${f(a)} 0H${f(s - a)}`,
    `C${f(s - b)} 0 ${f(s - c)} 0 ${f(s - d)} ${f(e)}`,
    `C${f(s - g)} ${f(h)} ${f(s - h)} ${f(g)} ${f(s - e)} ${f(d)}`,
    `C${s} ${f(c)} ${s} ${f(b)} ${s} ${f(a)}V${f(s - a)}`,
    `C${s} ${f(s - b)} ${s} ${f(s - c)} ${f(s - e)} ${f(s - d)}`,
    `C${f(s - h)} ${f(s - g)} ${f(s - g)} ${f(s - h)} ${f(s - d)} ${f(s - e)}`,
    `C${f(s - c)} ${s} ${f(s - b)} ${s} ${f(s - a)} ${s}H${f(a)}`,
    `C${f(b)} ${s} ${f(c)} ${s} ${f(d)} ${f(s - e)}`,
    `C${f(g)} ${f(s - h)} ${f(h)} ${f(s - g)} ${f(e)} ${f(s - d)}`,
    `C0 ${f(s - c)} 0 ${f(s - b)} 0 ${f(s - a)}V${f(a)}`,
    `C0 ${f(b)} 0 ${f(c)} ${f(e)} ${f(d)}`,
    `C${f(h)} ${f(g)} ${f(g)} ${f(h)} ${f(d)} ${f(e)}`,
    `C${f(c)} 0 ${f(b)} 0 ${f(a)} 0Z`,
  ].join("");
}

const TORII = `
    <path d="M140 286 Q512 226 884 286 L872 352 Q512 302 152 352 Z"/>
    <rect x="214" y="352" width="596" height="44" rx="10"/>
    <rect x="236" y="470" width="552" height="58" rx="12"/>
    <rect x="484" y="396" width="56" height="74"/>
    <path d="M302 396 H372 L384 812 H290 Z"/>
    <path d="M652 396 H722 L734 812 H640 Z"/>`;

function iconSvg({ fullBleed }) {
  const shape = squirclePath(SIZE, RADIUS);
  const fill = fullBleed ? `<rect width="${SIZE}" height="${SIZE}"` : `<path d="${shape}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff8a5c"/>
      <stop offset="0.55" stop-color="#ec4f2c"/>
      <stop offset="1" stop-color="#c3321a"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.5" cy="0" r="0.75">
      <stop offset="0" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="glyph" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#ffe6dc"/>
    </linearGradient>
    <filter id="lift" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#5c1405" flood-opacity="0.35"/>
    </filter>
  </defs>
  ${fill} fill="url(#bg)"/>
  ${fill} fill="url(#sheen)"/>
  <g fill="url(#glyph)" filter="url(#lift)">${TORII}
  </g>${
    fullBleed
      ? ""
      : `
  <path d="${shape}" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1" vector-effect="non-scaling-stroke"/>`
  }
</svg>
`;
}

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: (72 * size) / SIZE }).resize(size, size).png().toBuffer();
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size % 256, entry);
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const rounded = iconSvg({ fullBleed: false });
const bleed = iconSvg({ fullBleed: true });

const out = (name, data) => writeFile(PUBLIC + name, data);

await out("icon.svg", rounded);
await out("icon-192.png", await png(rounded, 192));
await out("icon-512.png", await png(rounded, 512));
await out("icon-maskable-512.png", await png(bleed, 512));
await out("apple-touch-icon.png", await png(bleed, 180));
await out(
  "favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) }))))
);

console.log("Icons written to public/");
