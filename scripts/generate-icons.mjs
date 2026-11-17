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

const FIELD = "#eceff2";
const VERMILION = "#c03a24";

const TORII = `
    <path d="M13 29 Q50 20 87 29 L85.5 37 Q50 30 14.5 37 Z"/>
    <rect x="21" y="43" width="58" height="6.5" rx="1.5"/>
    <rect x="47" y="37" width="6" height="6"/>
    <path d="M29 37 H37 L38.5 84 H27.5 Z"/>
    <path d="M63 37 H71 L72.5 84 H61.5 Z"/>`;

function iconSvg({ fullBleed, inset = 1 }) {
  const shape = squirclePath(SIZE, RADIUS);
  const fill = fullBleed ? `<rect width="${SIZE}" height="${SIZE}"` : `<path d="${shape}"`;
  const scale = (SIZE / 100) * inset;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  ${fill} fill="${FIELD}"/>
  <g fill="${VERMILION}" transform="translate(${SIZE / 2} ${SIZE / 2}) scale(${f(scale)}) translate(-50 -52)">${TORII}
  </g>${
    fullBleed
      ? ""
      : `
  <path d="${shape}" fill="none" stroke="#12294a" stroke-opacity="0.12" stroke-width="1" vector-effect="non-scaling-stroke"/>`
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
const maskable = iconSvg({ fullBleed: true, inset: 0.78 });
const apple = iconSvg({ fullBleed: true, inset: 0.92 });

const out = (name, data) => writeFile(PUBLIC + name, data);

await out("icon.svg", rounded);
await out("icon-192.png", await png(rounded, 192));
await out("icon-512.png", await png(rounded, 512));
await out("icon-maskable-512.png", await png(maskable, 512));
await out("apple-touch-icon.png", await png(apple, 180));
await out(
  "favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(rounded, size) }))))
);

console.log("Icons written to public/");
