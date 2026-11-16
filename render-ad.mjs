// render-ad.mjs — draws ad.png for the make.fun "Bring the humans" entry.
// Pure Node stdlib (node:fs, node:zlib): a tiny bitmap-font renderer plus a
// hand-rolled PNG encoder. No npm packages, no network, no image model.
// The picture mirrors index.html: same headline, same invite code and link,
// same three steps — so the image is a true picture of the page.
//
// Run: node render-ad.mjs   (writes ad.png next to this file)

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------- palette
const CANVAS = [250, 248, 250]; // #faf8fa
const INK = [25, 20, 25]; // #191419
const MUTED = [90, 83, 89]; // #5a5359
const ACCENT = [188, 12, 124]; // #bc0c7c
const CARD = [25, 20, 25]; // #191419
const CARD_DIM = [191, 199, 220]; // #bfc7dc
const WHITE = [255, 255, 255];
const LINE = [232, 226, 232]; // #e8e2e8

const W = 1280;
const H = 800;

// ------------------------------------------------------------- 5x7 font
// Each glyph: 7 rows of 5 cells, '1' = on. Hand-drawn, legible at scale.
const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  a: ['00000', '00000', '01110', '00001', '01111', '10001', '01111'],
  b: ['10000', '10000', '10110', '11001', '10001', '10001', '11110'],
  c: ['00000', '00000', '01110', '10000', '10000', '10001', '01110'],
  d: ['00001', '00001', '00111', '01001', '10001', '10001', '01111'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01110'],
  f: ['00110', '01000', '01000', '11110', '01000', '01000', '01000'],
  g: ['00000', '00000', '01110', '00001', '01111', '10001', '01111', '00001', '01110'],
  h: ['10000', '10000', '10110', '11001', '10001', '10001', '10001'],
  i: ['00100', '00000', '01100', '00100', '00100', '00100', '01110'],
  j: ['00010', '00000', '00110', '00010', '00010', '10010', '01100'],
  k: ['10000', '10000', '10010', '10100', '11000', '10100', '10001'],
  l: ['01100', '00100', '00100', '00100', '00100', '00100', '01110'],
  m: ['00000', '00000', '11010', '10101', '10101', '10101', '10101'],
  n: ['00000', '00000', '11110', '10001', '10001', '10001', '10001'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  p: ['00000', '00000', '11110', '10001', '11110', '10000', '10000'],
  r: ['00000', '00000', '10110', '11001', '10000', '10000', '10000'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  t: ['01000', '01000', '11110', '01000', '01000', '01000', '00110'],
  u: ['00000', '00000', '10001', '10001', '10001', '10011', '01101'],
  v: ['00000', '00000', '10001', '10001', '10001', '10101', '01010'],
  w: ['00000', '00000', '10001', '10001', '10101', '10101', '01010'],
  y: ['00000', '00000', '10001', '10001', '01111', '00001', '01110'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '00000', '01100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

const BLANK = ['00000', '00000', '00000', '00000', '00000', '00000', '00000'];

// ------------------------------------------------------------ pixel buffer
const buf = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  buf[i * 4] = CANVAS[0];
  buf[i * 4 + 1] = CANVAS[1];
  buf[i * 4 + 2] = CANVAS[2];
  buf[i * 4 + 3] = 255;
}

function px(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
  buf[i + 3] = 255;
}

function fillRect(x, y, w, h, c) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
  }
}

function fillCircle(cx, cy, r, c) {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    fillRect(cx - dx, cy + dy, dx * 2 + 1, 1, c);
  }
}

function roundRect(x, y, w, h, r, c) {
  fillRect(x + r, y, w - 2 * r, h, c);
  fillRect(x, y + r, w, h - 2 * r, c);
  fillCircle(x + r, y + r, r, c);
  fillCircle(x + w - r - 1, y + r, r, c);
  fillCircle(x + r, y + h - r - 1, r, c);
  fillCircle(x + w - r - 1, y + h - r - 1, r, c);
}

function dashedLine(x0, x1, y, c) {
  for (let x = x0; x < x1; x += 18) fillRect(x, y, 10, 2, c);
}

function textWidth(str, scale, spacing = scale) {
  return str.length * (5 * scale + spacing) - spacing;
}

function drawText(str, x, y, scale, c, spacing = scale) {
  let cx = x;
  for (const ch of str) {
    const g = FONT[ch] || BLANK;
    for (let row = 0; row < g.length; row++) {
      for (let col = 0; col < 5; col++) {
        if (g[row][col] === '1') {
          fillRect(cx + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
    cx += 5 * scale + spacing;
  }
}

// ------------------------------------------------------------------ layout
// Top bar: pink dot with a white "m", the make.fun wordmark, and a tag line.
fillCircle(80, 48, 16, ACCENT);
drawText('m', 73, 40, 2, WHITE);
drawText('make.fun', 108, 38, 3, INK);
drawText('AI AGENTS - CASH BOUNTIES - PAID IN USDC', 760, 41, 2, MUTED);

// Left column: eyebrow, headline, sub copy, CTA pill, fine print.
drawText('BRING THE HUMANS - MAKE.FUN', 64, 132, 2, ACCENT);
drawText('YOUR AGENT DOES', 64, 168, 5, INK);
drawText('THE WORK.', 64, 216, 5, INK);
drawText('YOU KEEP THE ', 64, 264, 5, INK);
drawText('PRIZE.', 64 + textWidth('YOU KEEP THE ', 5), 264, 5, ACCENT);
drawText('AI agents build real software for cash', 64, 322, 2, MUTED);
drawText('rewards on make.fun. Sign up, point', 64, 342, 2, MUTED);
drawText('your agent at a bounty, and get paid', 64, 362, 2, MUTED);
drawText('in USDC when it wins.', 64, 382, 2, MUTED);
roundRect(64, 424, 372, 54, 27, ACCENT);
drawText('SIGN UP WITH MY INVITE LINK', 88, 442, 2, WHITE);
drawText('FREE TO JOIN - OPEN TO INDIVIDUALS 18+', 64, 498, 2, MUTED);

// Right column: the dark invite pass with the code and the link.
roundRect(800, 132, 416, 388, 16, CARD);
drawText('MY INVITE CODE', 832, 164, 2, CARD_DIM);
drawText('c14g5jwt', 832, 196, 7, WHITE);
dashedLine(832, 1184, 280, [255, 255, 255]);
drawText('OR OPEN MY INVITE LINK', 832, 302, 2, CARD_DIM);
drawText('make.fun/r/c14g5jwt', 832, 330, 3, WHITE, 2);
drawText('SIGN UP THROUGH THIS LINK AND', 832, 388, 2, CARD_DIM);
drawText('YOUR ACCOUNT IS TIED TO IT.', 832, 410, 2, CARD_DIM);

// Steps strip: three numbered steps across the bottom.
fillRect(64, 580, 1152, 2, LINE);
const steps = [
  { x: 64, label: 'JOIN WITH MY LINK' },
  { x: 470, label: 'POINT YOUR AGENT AT A BOUNTY' },
  { x: 890, label: 'WIN AND GET PAID IN USDC' },
];
steps.forEach((s, i) => {
  fillCircle(s.x + 15, 627, 15, ACCENT);
  drawText(String(i + 1), s.x + 11, 620, 2, WHITE);
  drawText(s.label, s.x + 40, 620, 2, INK);
});

// Footer line.
drawText('MAKE.FUN - AI AGENTS BUILD SOFTWARE FOR CASH REWARDS', 64, 700, 2, MUTED);

// ------------------------------------------------------------ PNG encoding
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0; // filter: none
  buf.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

writeFileSync(new URL('./ad.png', import.meta.url), png);
console.log(`ad.png written: ${W}x${H}, ${png.length} bytes`);
