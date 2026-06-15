/**
 * Run with: node scripts/generate-tilemaps.mjs
 * Outputs public/assets/tilemaps/level-N.json for all 7 levels.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'tilemaps');
mkdirSync(OUT_DIR, { recursive: true });

const TILE = {
  EMPTY: 0,
  GROUND_TOP: 1,
  GROUND_FILL: 2,
  PLATFORM: 3,
  SPIKE: 25,
};

function createLayer(width, height, rows) {
  const data = new Array(width * height).fill(TILE.EMPTY);
  rows.forEach(({ row, col, len, id }) => {
    for (let c = col; c < col + len; c++) {
      if (c < width) data[row * width + c] = id;
    }
  });
  return data;
}

function ground(width, height, fromRow) {
  const rows = [];
  for (let row = fromRow; row < height; row++) {
    rows.push({ row, col: 0, len: width, id: row === fromRow ? TILE.GROUND_TOP : TILE.GROUND_FILL });
  }
  return rows;
}

function makeTileset() {
  return [{
    columns: 12,
    firstgid: 1,
    image: '../sprites/tiles.png',
    imageheight: 48,
    imagewidth: 192,
    margin: 0,
    name: 'tiles',
    spacing: 0,
    tilecount: 36,
    tileheight: 16,
    tilewidth: 16,
    tiles: [
      { id: 0, properties: [{ name: 'collides', type: 'bool', value: true }] },
      { id: 1, properties: [{ name: 'collides', type: 'bool', value: true }] },
      { id: 2, properties: [{ name: 'collides', type: 'bool', value: true }] },
      { id: 12, properties: [{ name: 'collides', type: 'bool', value: true }] },
      { id: 13, properties: [{ name: 'collides', type: 'bool', value: true }] },
      { id: 24, properties: [{ name: 'hazard', type: 'bool', value: true }] },
      { id: 25, properties: [{ name: 'hazard', type: 'bool', value: true }] },
    ],
  }];
}

function makemap(name, w, h, platformRows, hazardRows = []) {
  const tilesets = makeTileset();
  const makeLayer = (layerName, id, rows) => ({
    data: createLayer(w, h, rows),
    height: h, id, name: layerName, opacity: 1,
    type: 'tilelayer', visible: true, width: w, x: 0, y: 0,
  });

  const map = {
    compressionlevel: -1, height: h, infinite: false,
    layers: [
      makeLayer('Background', 1, []),
      makeLayer('Platforms', 2, [...ground(w, h, h - 4), ...platformRows]),
      makeLayer('Hazards', 3, hazardRows),
    ],
    nextlayerid: 4, nextobjectid: 1, orientation: 'orthogonal',
    renderorder: 'right-down', tiledversion: '1.10.2',
    tileheight: 16, tilesets, tilewidth: 16,
    type: 'map', version: '1.10', width: w,
  };

  writeFileSync(join(OUT_DIR, `${name}.json`), JSON.stringify(map));
  console.log(`Generated ${name}.json (${w}×${h})`);
}

// ─── Level 1: Tutorial Forest (80×20) ────────────────────────────────────────
makemap('level-1', 80, 20, [
  { row: 9, col: 8, len: 6, id: TILE.PLATFORM },
  { row: 11, col: 22, len: 6, id: TILE.PLATFORM },
  { row: 9, col: 38, len: 6, id: TILE.PLATFORM },
  { row: 11, col: 55, len: 6, id: TILE.PLATFORM },
]);

// ─── Level 2: Rising Forest (80×20) ──────────────────────────────────────────
makemap('level-2', 80, 20, [
  { row: 12, col: 5, len: 6, id: TILE.PLATFORM },
  { row: 10, col: 18, len: 5, id: TILE.PLATFORM },
  { row: 7, col: 30, len: 5, id: TILE.PLATFORM },  // high jump required
  { row: 9, col: 43, len: 6, id: TILE.PLATFORM },
  { row: 7, col: 58, len: 6, id: TILE.PLATFORM },
  // Pit gap in ground
  { row: 16, col: 23, len: 5, id: TILE.EMPTY },
  { row: 17, col: 23, len: 5, id: TILE.EMPTY },
  { row: 18, col: 23, len: 5, id: TILE.EMPTY },
  { row: 19, col: 23, len: 5, id: TILE.EMPTY },
]);

// ─── Level 3: Cave Descent (80×25) ───────────────────────────────────────────
makemap('level-3', 80, 25, [
  { row: 12, col: 8, len: 6, id: TILE.PLATFORM },
  { row: 8, col: 20, len: 4, id: TILE.PLATFORM },
  { row: 5, col: 32, len: 4, id: TILE.PLATFORM },
  { row: 8, col: 44, len: 4, id: TILE.PLATFORM },
  { row: 12, col: 57, len: 6, id: TILE.PLATFORM },
  // Wall column for wall-slide section
  { row: 3, col: 26, len: 1, id: TILE.GROUND_FILL },
  { row: 4, col: 26, len: 1, id: TILE.GROUND_FILL },
  { row: 5, col: 26, len: 1, id: TILE.GROUND_FILL },
  { row: 6, col: 26, len: 1, id: TILE.GROUND_FILL },
  { row: 7, col: 26, len: 1, id: TILE.GROUND_FILL },
], [
  { row: 20, col: 15, len: 3, id: TILE.SPIKE },
  { row: 20, col: 38, len: 3, id: TILE.SPIKE },
]);

// ─── Level 4: Flooded Cave (80×25) ───────────────────────────────────────────
makemap('level-4', 80, 25, [
  { row: 14, col: 5, len: 5, id: TILE.PLATFORM },
  { row: 12, col: 20, len: 5, id: TILE.PLATFORM },
  { row: 14, col: 38, len: 5, id: TILE.PLATFORM },
  { row: 10, col: 53, len: 5, id: TILE.PLATFORM },
  // Door wall
  { row: 16, col: 30, len: 2, id: TILE.GROUND_FILL },
  { row: 17, col: 30, len: 2, id: TILE.GROUND_FILL },
  { row: 18, col: 30, len: 2, id: TILE.GROUND_FILL },
], [
  { row: 20, col: 10, len: 4, id: TILE.SPIKE },
]);

// ─── Level 5: Fortress Battlements (100×25) ──────────────────────────────────
makemap('level-5', 100, 25, [
  { row: 14, col: 8, len: 6, id: TILE.PLATFORM },
  { row: 12, col: 22, len: 6, id: TILE.PLATFORM },
  { row: 10, col: 38, len: 6, id: TILE.PLATFORM },
  { row: 12, col: 55, len: 6, id: TILE.PLATFORM },
  { row: 10, col: 70, len: 6, id: TILE.PLATFORM },
  { row: 12, col: 84, len: 6, id: TILE.PLATFORM },
  // Dash gap
  { row: 21, col: 40, len: 8, id: TILE.EMPTY },
  { row: 22, col: 40, len: 8, id: TILE.EMPTY },
  { row: 23, col: 40, len: 8, id: TILE.EMPTY },
  { row: 24, col: 40, len: 8, id: TILE.EMPTY },
], [
  { row: 20, col: 15, len: 3, id: TILE.SPIKE },
  { row: 20, col: 60, len: 3, id: TILE.SPIKE },
]);

// ─── Level 6: Trap Halls (100×25) ────────────────────────────────────────────
makemap('level-6', 100, 25, [
  { row: 16, col: 8, len: 4, id: TILE.PLATFORM },
  { row: 13, col: 18, len: 4, id: TILE.PLATFORM },
  { row: 10, col: 28, len: 4, id: TILE.PLATFORM },
  { row: 13, col: 40, len: 4, id: TILE.PLATFORM },
  { row: 16, col: 52, len: 4, id: TILE.PLATFORM },
  { row: 13, col: 64, len: 4, id: TILE.PLATFORM },
  { row: 10, col: 76, len: 4, id: TILE.PLATFORM },
  { row: 13, col: 88, len: 4, id: TILE.PLATFORM },
], [
  { row: 20, col: 13, len: 2, id: TILE.SPIKE },
  { row: 20, col: 25, len: 2, id: TILE.SPIKE },
  { row: 20, col: 48, len: 2, id: TILE.SPIKE },
  { row: 20, col: 72, len: 2, id: TILE.SPIKE },
]);

// ─── Level 7: Final Escape (120×25) ──────────────────────────────────────────
makemap('level-7', 120, 25, [
  { row: 15, col: 8, len: 4, id: TILE.PLATFORM },
  { row: 12, col: 18, len: 4, id: TILE.PLATFORM },
  { row: 9, col: 28, len: 4, id: TILE.PLATFORM },
  { row: 6, col: 38, len: 4, id: TILE.PLATFORM },
  { row: 9, col: 50, len: 4, id: TILE.PLATFORM },
  { row: 12, col: 62, len: 4, id: TILE.PLATFORM },
  { row: 9, col: 74, len: 4, id: TILE.PLATFORM },
  { row: 6, col: 86, len: 4, id: TILE.PLATFORM },
  { row: 9, col: 98, len: 4, id: TILE.PLATFORM },
  { row: 12, col: 110, len: 4, id: TILE.PLATFORM },
], [
  { row: 20, col: 15, len: 2, id: TILE.SPIKE },
  { row: 20, col: 35, len: 2, id: TILE.SPIKE },
  { row: 20, col: 55, len: 2, id: TILE.SPIKE },
  { row: 20, col: 75, len: 2, id: TILE.SPIKE },
  { row: 20, col: 95, len: 2, id: TILE.SPIKE },
]);

console.log('All tilemaps generated.');
