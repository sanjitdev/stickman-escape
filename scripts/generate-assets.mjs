/**
 * generate-assets.mjs
 * Generates all required sprite PNGs and creates the audio directory.
 * Uses only Node.js built-in modules — no npm install needed.
 *
 * Run: node scripts/generate-assets.mjs
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT    = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPRITES = join(ROOT, 'public/assets/sprites');
const AUDIO   = join(ROOT, 'public/assets/audio');

mkdirSync(SPRITES, { recursive: true });
mkdirSync(AUDIO,   { recursive: true });

// ── CRC-32 (required by PNG chunk format) ─────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG encoder ───────────────────────────────────────────────────────────────
function u32BE(n) {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcInput  = Buffer.concat([typeBytes, dataBytes]);
  return Buffer.concat([
    Buffer.from(u32BE(dataBytes.length)),
    typeBytes,
    dataBytes,
    Buffer.from(u32BE(crc32(crcInput))),
  ]);
}

/**
 * Encode RGBA pixel data as a PNG Buffer.
 * @param {number}     w
 * @param {number}     h
 * @param {Uint8Array} pixels  flat RGBA, row-major
 */
function encodePNG(w, h, pixels) {
  // Build raw pre-compression data: filter-byte (0 = None) + row RGBA values
  const raw = new Uint8Array(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 4);
    raw[rowStart] = 0; // filter: None
    raw.set(pixels.subarray(y * w * 4, (y + 1) * w * 4), rowStart + 1);
  }
  const ihdr = Buffer.from([...u32BE(w), ...u32BE(h), 8, 6, 0, 0, 0]);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Low-level draw helpers ────────────────────────────────────────────────────
function createCanvas(w, h, r = 0, g = 0, b = 0, a = 0) {
  const px = new Uint8Array(w * h * 4);
  if (a > 0) {
    for (let i = 0; i < px.length; i += 4) {
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
    }
  }
  return px;
}

function setPixel(px, w, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= w) return;
  const i = (Math.floor(y) * w + Math.floor(x)) * 4;
  if (i < 0 || i + 3 >= px.length) return;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}

function fillRect(px, w, x, y, rw, rh, r, g, b, a = 255) {
  for (let dy = 0; dy < rh; dy++)
    for (let dx = 0; dx < rw; dx++)
      setPixel(px, w, x + dx, y + dy, r, g, b, a);
}

function fillCircle(px, w, cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++)
    for (let dx = -radius; dx <= radius; dx++)
      if (dx * dx + dy * dy <= r2)
        setPixel(px, w, cx + dx, cy + dy, r, g, b, a);
}

function gradientRect(px, w, x, y, rw, rh, r1, g1, b1, r2, g2, b2) {
  for (let dy = 0; dy < rh; dy++) {
    const t = rh > 1 ? dy / (rh - 1) : 0;
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    for (let dx = 0; dx < rw; dx++) setPixel(px, w, x + dx, y + dy, r, g, b);
  }
}

function save(filename, png) {
  writeFileSync(join(SPRITES, filename), png);
  console.log(`  ✓ sprites/${filename}`);
}

// ── Stickman helper ───────────────────────────────────────────────────────────
/** Draw a simple stickman centred at (cx, cy) using the given body colour. */
function drawStickman(px, totalW, cx, cy, bodyR, bodyG, bodyB, variant = 'normal') {
  const skin = [255, 220, 170];
  const dark = [30,  30,  30];

  // Head
  fillCircle(px, totalW, cx, cy - 16, 7, ...skin);
  // Eyes
  setPixel(px, totalW, cx - 3, cy - 17, ...dark);
  setPixel(px, totalW, cx + 2, cy - 17, ...dark);

  // Torso
  fillRect(px, totalW, cx - 5, cy - 9, 10, 14, bodyR, bodyG, bodyB);

  // Arms (vary by variant)
  if (variant === 'dash') {
    fillRect(px, totalW, cx - 11, cy - 7, 6, 3, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx - 5,  cy - 5, 16, 3, bodyR, bodyG, bodyB);
  } else if (variant === 'jump') {
    fillRect(px, totalW, cx - 11, cy - 11, 6, 3, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 5,  cy - 11, 6, 3, bodyR, bodyG, bodyB);
  } else if (variant === 'dead') {
    fillRect(px, totalW, cx - 11, cy - 3, 6, 3, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 5,  cy - 3, 6, 3, bodyR, bodyG, bodyB);
  } else {
    fillRect(px, totalW, cx - 11, cy - 8, 6, 3, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 5,  cy - 8, 6, 3, bodyR, bodyG, bodyB);
  }

  // Legs (vary by variant)
  if (variant === 'run1') {
    fillRect(px, totalW, cx - 5, cy + 5, 4, 10, bodyR, bodyG, bodyB);
    // front leg kicked forward
    fillRect(px, totalW, cx + 1, cy + 5, 4, 6,  bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 5, cy + 9, 4, 6,  bodyR, bodyG, bodyB);
  } else if (variant === 'run2') {
    // front leg back
    fillRect(px, totalW, cx - 8, cy + 5, 4, 6,  bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx - 4, cy + 9, 4, 6,  bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 1, cy + 5, 4, 10, bodyR, bodyG, bodyB);
  } else if (variant === 'jump') {
    // legs tucked
    fillRect(px, totalW, cx - 5, cy + 5, 4, 7, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 1, cy + 5, 4, 7, bodyR, bodyG, bodyB);
  } else if (variant === 'dead') {
    fillRect(px, totalW, cx - 7, cy + 5, 4, 10, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 3, cy + 5, 4, 10, bodyR, bodyG, bodyB);
    // X eyes
    setPixel(px, totalW, cx - 4, cy - 18, ...dark);
    setPixel(px, totalW, cx - 2, cy - 16, ...dark);
    setPixel(px, totalW, cx + 1, cy - 18, ...dark);
    setPixel(px, totalW, cx + 3, cy - 16, ...dark);
  } else {
    fillRect(px, totalW, cx - 5, cy + 5, 4, 10, bodyR, bodyG, bodyB);
    fillRect(px, totalW, cx + 1, cy + 5, 4, 10, bodyR, bodyG, bodyB);
  }
}

// ── Asset generators ──────────────────────────────────────────────────────────

/** Player spritesheet: 8 frames × 32×48  (0=idle,1-2=run,3=jump,4=fall,5=dash,6=dead,7=wall-slide) */
function makePlayer() {
  const FW = 32, FH = 48, FRAMES = 8;
  const px = createCanvas(FW * FRAMES, FH);

  const frameSpec = [
    { r: 68,  g: 136, b: 255, variant: 'normal'  }, // 0 idle
    { r: 68,  g: 170, b: 255, variant: 'run1'    }, // 1 run
    { r: 68,  g: 204, b: 255, variant: 'run2'    }, // 2 run
    { r: 136, g: 221, b: 255, variant: 'jump'    }, // 3 jump
    { r: 102, g: 153, b: 204, variant: 'normal'  }, // 4 fall
    { r: 153, g: 68,  b: 255, variant: 'dash'    }, // 5 dash
    { r: 255, g: 68,  b: 68,  variant: 'dead'    }, // 6 dead
    { r: 68,  g: 255, b: 136, variant: 'normal'  }, // 7 wall-slide
  ];

  frameSpec.forEach(({ r, g, b, variant }, i) => {
    const cx = i * FW + FW / 2;
    const cy = FH / 2 + 4;
    drawStickman(px, FW * FRAMES, cx, cy, r, g, b, variant);
  });

  return encodePNG(FW * FRAMES, FH, px);
}

/** Enemy spritesheet: 2 frames × 32×32 */
function makeEnemy() {
  const FW = 32, FH = 32, FRAMES = 2;
  const px = createCanvas(FW * FRAMES, FH);
  const dark = [30, 30, 30];

  [[204, 34, 34], [238, 68, 68]].forEach(([r, g, b], i) => {
    const cx = i * FW + FW / 2;
    const cy = 16;
    // Head
    fillCircle(px, FW * FRAMES, cx, cy - 8, 6, 255, 220, 170);
    setPixel(px, FW * FRAMES, cx - 2, cy - 9, ...dark);
    setPixel(px, FW * FRAMES, cx + 2, cy - 9, ...dark);
    // Body
    fillRect(px, FW * FRAMES, cx - 5, cy - 2, 10, 12, r, g, b);
    // Arms
    fillRect(px, FW * FRAMES, cx - 9, cy - 1, 4, 3, r, g, b);
    fillRect(px, FW * FRAMES, cx + 5, cy - 1, 4, 3, r, g, b);
    // Legs (alternating)
    if (i === 0) {
      fillRect(px, FW * FRAMES, cx - 4, cy + 10, 3, 8, r, g, b);
      fillRect(px, FW * FRAMES, cx + 1, cy + 10, 3, 8, r, g, b);
    } else {
      fillRect(px, FW * FRAMES, cx - 5, cy + 10, 3, 8, r, g, b);
      fillRect(px, FW * FRAMES, cx + 2, cy + 10, 3, 8, r, g, b);
    }
  });

  return encodePNG(FW * FRAMES, FH, px);
}

/** Tile sheet: 12 columns × 16px wide, 3 rows × 16px tall */
function makeTiles() {
  const TW = 16, TH = 16, COLS = 12, ROWS = 3;
  const W = TW * COLS, H = TH * ROWS;
  const px = createCanvas(W, H);

  for (let col = 0; col < COLS; col++) {
    const ox = col * TW;
    // Row 0 — ground: green
    fillRect(px, W, ox,     0,       TW,     TH,     68,  119, 51);
    fillRect(px, W, ox,     0,       TW,     3,      102, 170, 68);   // top edge
    fillRect(px, W, ox,     TH - 1,  TW,     1,      51,  85,  34);   // bottom edge
    // Row 1 — platform: wooden brown
    fillRect(px, W, ox,     TH,      TW,     TH,     136, 102, 68);
    fillRect(px, W, ox,     TH,      TW,     2,      187, 153, 102);  // top edge
    fillRect(px, W, ox + 1, TH + 3,  TW - 2, 2,      102, 68,  34);   // grain line
    fillRect(px, W, ox + 1, TH + 8,  TW - 2, 2,      102, 68,  34);   // grain line
    // Row 2 — spike: red triangle
    const sx = ox + TW / 2;
    for (let py = 0; py < TH; py++) {
      const halfW = Math.max(1, Math.round((TH - py) / TH * (TW / 2 - 1)));
      fillRect(px, W, sx - halfW, TH * 2 + py, halfW * 2, 1, 204, 34, 34);
    }
    fillRect(px, W, ox, TH * 2 + TH - 1, TW, 1, 170, 17, 17); // base
  }

  return encodePNG(W, H, px);
}

/** Door: 32×48, with frame, panel, and handle. isOpen = brighter/open variant. */
function makeDoor(isOpen) {
  const W = 32, H = 48;
  const px = createCanvas(W, H);
  const [frameR, frameG, frameB] = [85, 51, 17];
  const [panelR, panelG, panelB] = isOpen ? [136, 187, 68] : [102, 68, 34];
  const highlightR = panelR + 30, highlightG = panelG + 30, highlightB = panelB + 20;

  fillRect(px, W, 0, 0, W, H, frameR, frameG, frameB);                // outer frame
  fillRect(px, W, 3, 2, W - 6, H - 2, panelR, panelG, panelB);       // door panel
  fillRect(px, W, 4, 3, W - 8, 6, highlightR, highlightG, highlightB); // top panel
  fillRect(px, W, 4, 12, W - 8, H - 16, Math.max(0, panelR - 15), Math.max(0, panelG - 15), Math.max(0, panelB - 15)); // bottom panel
  if (!isOpen) {
    fillCircle(px, W, W - 7, H / 2, 3, 255, 204, 34);  // handle (gold)
  } else {
    // open door shows the door edge receding
    fillRect(px, W, 1, 2, 5, H - 2, Math.max(0, panelR - 30), Math.max(0, panelG - 30), Math.max(0, panelB - 30));
  }
  return encodePNG(W, H, px);
}

/** Platform tile: 80×16, with a wooden plank look. */
function makePlatform(isFalling) {
  const W = 80, H = 16;
  const px = createCanvas(W, H);
  const [r, g, b] = isFalling ? [170, 136, 85] : [153, 102, 68];
  fillRect(px, W, 0, 0, W, H, r, g, b);
  fillRect(px, W, 0, 0, W, 2, r + 30, g + 30, b + 20);       // top highlight
  fillRect(px, W, 0, H - 1, W, 1, Math.max(0, r - 30), Math.max(0, g - 30), Math.max(0, b - 30)); // shadow
  // Plank lines
  for (let x = 0; x < W; x += 20)
    fillRect(px, W, x, 3, 1, H - 4, Math.max(0, r - 20), Math.max(0, g - 20), Math.max(0, b - 20));
  if (isFalling) {
    // Crack marks
    for (let cx = 10; cx < W; cx += 25) {
      setPixel(px, W, cx,     7, 80, 50, 20);
      setPixel(px, W, cx + 1, 8, 80, 50, 20);
      setPixel(px, W, cx + 2, 7, 80, 50, 20);
    }
  }
  return encodePNG(W, H, px);
}

/** Coin: 14×14 gold circle. */
function makeCoin() {
  const W = 14, H = 14;
  const px = createCanvas(W, H);
  fillCircle(px, W, 7, 7, 6, 255, 204, 0);
  fillCircle(px, W, 6, 6, 3, 255, 238, 102);  // shine
  return encodePNG(W, H, px);
}

/** Key: 24×12, gold key shape. */
function makeKey() {
  const W = 24, H = 12;
  const px = createCanvas(W, H);
  fillCircle(px, W, 6, 6, 5, 255, 187, 0);    // bow (circular part)
  fillCircle(px, W, 6, 6, 2, 0, 0, 0, 0);     // hole in bow
  fillRect(px, W, 10, 4, 12, 4, 255, 187, 0); // shaft
  fillRect(px, W, 18, 6, 3, 4, 255, 187, 0);  // teeth 1
  fillRect(px, W, 14, 6, 3, 3, 255, 187, 0);  // teeth 2
  return encodePNG(W, H, px);
}

/** Portal: 32×48, cyan glowing arch. */
function makePortal() {
  const W = 32, H = 48;
  const px = createCanvas(W, H);
  // Outer ring
  fillCircle(px, W, W / 2, 16, 14, 68, 255, 204);
  // Inner (transparent hole)
  fillCircle(px, W, W / 2, 16, 9, 0, 0, 0, 0);
  // Glow base
  fillRect(px, W, 6, 16, W - 12, H - 18, 68, 255, 204, 160);
  fillRect(px, W, 10, 18, W - 20, H - 22, 170, 255, 230, 200);
  // Inner bright core
  fillRect(px, W, 13, 22, 6, H - 30, 255, 255, 255, 220);
  return encodePNG(W, H, px);
}

/** Checkpoint: 24×48, flag on pole. */
function makeCheckpoint() {
  const W = 24, H = 48;
  const px = createCanvas(W, H);
  fillRect(px, W, 4, 0, 3, H, 170, 170, 170);   // pole
  fillRect(px, W, 7, 4, 14, 10, 68, 170, 255);   // flag: unfurled
  fillRect(px, W, 7, 4, 2,  10, 51, 119, 187);   // flag: shadow side
  // Star on flag
  fillCircle(px, W, 14, 9, 3, 255, 238, 68);
  return encodePNG(W, H, px);
}

/** Background: 960×544, vertical gradient. */
function makeBackground(r1, g1, b1, r2, g2, b2) {
  const W = 960, H = 544;
  const px = createCanvas(W, H);
  gradientRect(px, W, 0, 0, W, H, r1, g1, b1, r2, g2, b2);
  return encodePNG(W, H, px);
}

// ── Write sprites ─────────────────────────────────────────────────────────────
console.log('\nGenerating sprites...\n');

save('player.png',           makePlayer());
save('enemy.png',            makeEnemy());
save('tiles.png',            makeTiles());
save('coin.png',             makeCoin());
save('key.png',              makeKey());
save('door-closed.png',      makeDoor(false));
save('door-open.png',        makeDoor(true));
save('platform-moving.png',  makePlatform(false));
save('platform-falling.png', makePlatform(true));
save('portal.png',           makePortal());
save('checkpoint.png',       makeCheckpoint());
save('bg-forest.png',        makeBackground(12, 35, 12,   30, 75, 30));
save('bg-cave.png',          makeBackground(10, 10, 28,   22, 22, 55));
save('bg-fortress.png',      makeBackground(28, 10, 10,   55, 22, 22));

console.log(`
Audio files are optional — the game runs silently without them.
To use Kenney.nl audio, purchase the All-in-1 bundle and copy files to:
  public/assets/audio/

  music-forest.ogg / .mp3   ← Music Jingles
  music-cave.ogg   / .mp3   ← Music Jingles
  music-fortress.ogg / .mp3 ← Music Jingles
  sfx-jump.ogg              ← RPG Audio
  sfx-double-jump.ogg       ← RPG Audio
  sfx-land.ogg              ← RPG Audio
  sfx-dash.ogg              ← RPG Audio
  sfx-coin.ogg              ← RPG Audio
  sfx-key.ogg               ← Interface Sounds
  sfx-death.ogg             ← RPG Audio
  sfx-checkpoint.ogg        ← Interface Sounds
  sfx-door.ogg              ← Interface Sounds
  sfx-stomp.ogg             ← RPG Audio
  sfx-portal.ogg            ← Interface Sounds
  sfx-click.ogg             ← Interface Sounds

Bundle: https://kenney.itch.io/kenney-game-assets
`);
