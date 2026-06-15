import { writeFileSync } from 'node:fs';

const levels = [
  {
    worldWidth: 1280, worldHeight: 320, ground: { y: 288, h: 64 },
    platforms: [
      { x: 176, y: 152, w: 96, h: 16 }, { x: 400, y: 184, w: 96, h: 16 },
      { x: 656, y: 152, w: 96, h: 16 }, { x: 928, y: 184, w: 96, h: 16 },
    ],
    hazards: [],
    playerSpawn: { x: 48, y: 224 }, exitPortal: { x: 1232, y: 240 },
    checkpoints: [{ x: 640, y: 224 }],
    coins: [
      { x: 144, y: 128 }, { x: 160, y: 128 }, { x: 176, y: 128 },
      { x: 368, y: 104 }, { x: 384, y: 104 }, { x: 400, y: 104 },
      { x: 624, y: 128 }, { x: 640, y: 128 }, { x: 896, y: 104 }, { x: 912, y: 104 },
    ],
    enemies: [
      { x: 320, y: 256, patrolStart: 240, patrolEnd: 400, type: 'basic' },
      { x: 800, y: 256, patrolStart: 720, patrolEnd: 880, type: 'basic' },
    ],
    keys: [], doors: [], movingPlatforms: [], fallingPlatforms: [],
  },
  {
    worldWidth: 1280, worldHeight: 320, ground: { y: 288, h: 64 },
    platforms: [
      { x: 128, y: 208, w: 96, h: 16 }, { x: 328, y: 176, w: 80, h: 16 },
      { x: 520, y: 128, w: 80, h: 16 }, { x: 736, y: 160, w: 96, h: 16 },
      { x: 976, y: 128, w: 96, h: 16 },
    ],
    hazards: [],
    playerSpawn: { x: 48, y: 224 }, exitPortal: { x: 1232, y: 240 },
    checkpoints: [{ x: 640, y: 224 }],
    coins: [
      { x: 112, y: 168 }, { x: 128, y: 168 }, { x: 304, y: 136 }, { x: 320, y: 136 },
      { x: 496, y: 88 }, { x: 512, y: 88 }, { x: 700, y: 120 }, { x: 716, y: 120 },
      { x: 944, y: 88 }, { x: 960, y: 88 },
    ],
    enemies: [
      { x: 200, y: 256, patrolStart: 140, patrolEnd: 320, type: 'basic' },
      { x: 640, y: 256, patrolStart: 580, patrolEnd: 720, type: 'basic' },
      { x: 1000, y: 256, patrolStart: 940, patrolEnd: 1100, type: 'basic' },
    ],
    keys: [], doors: [], movingPlatforms: [],
    fallingPlatforms: [{ x: 352, y: 200 }, { x: 432, y: 200 }, { x: 512, y: 200 }],
  },
  {
    worldWidth: 1280, worldHeight: 400, ground: { y: 368, h: 64 },
    platforms: [
      { x: 176, y: 208, w: 96, h: 16 }, { x: 344, y: 144, w: 64, h: 16 },
      { x: 536, y: 96, w: 64, h: 16 }, { x: 728, y: 144, w: 64, h: 16 },
      { x: 936, y: 208, w: 96, h: 16 },
    ],
    hazards: [{ x: 256, y: 356, w: 48, h: 16 }, { x: 632, y: 356, w: 48, h: 16 }],
    playerSpawn: { x: 48, y: 304 }, exitPortal: { x: 1232, y: 320 },
    checkpoints: [{ x: 560, y: 304 }],
    coins: [
      { x: 144, y: 168 }, { x: 160, y: 168 }, { x: 336, y: 112 }, { x: 352, y: 112 },
      { x: 528, y: 64 }, { x: 544, y: 64 }, { x: 720, y: 112 }, { x: 736, y: 112 },
      { x: 912, y: 168 }, { x: 928, y: 168 },
    ],
    enemies: [
      { x: 250, y: 352, patrolStart: 160, patrolEnd: 340, type: 'basic' },
      { x: 820, y: 352, patrolStart: 740, patrolEnd: 920, type: 'basic' },
    ],
    keys: [], doors: [], movingPlatforms: [], fallingPlatforms: [],
  },
  {
    worldWidth: 1280, worldHeight: 400, ground: { y: 368, h: 64 },
    platforms: [
      { x: 120, y: 240, w: 80, h: 16 }, { x: 344, y: 208, w: 80, h: 16 },
      { x: 640, y: 240, w: 80, h: 16 }, { x: 872, y: 176, w: 80, h: 16 },
    ],
    hazards: [{ x: 184, y: 356, w: 64, h: 16 }],
    playerSpawn: { x: 48, y: 304 }, exitPortal: { x: 1232, y: 320 },
    checkpoints: [{ x: 640, y: 304 }],
    coins: [
      { x: 112, y: 192 }, { x: 128, y: 192 }, { x: 336, y: 168 }, { x: 352, y: 168 },
      { x: 632, y: 192 }, { x: 648, y: 192 }, { x: 856, y: 128 }, { x: 872, y: 128 },
      { x: 1040, y: 192 }, { x: 1056, y: 192 },
    ],
    enemies: [
      { x: 240, y: 352, patrolStart: 160, patrolEnd: 360, type: 'basic' },
      { x: 800, y: 352, patrolStart: 720, patrolEnd: 900, type: 'basic' },
    ],
    keys: [{ x: 400, y: 352, id: 'key-blue' }],
    doors: [{ x: 500, y: 352, keyId: 'key-blue' }],
    movingPlatforms: [
      { x: 1000, y: 360, path: [{ x: 960, y: 360 }, { x: 1060, y: 360 }], speed: 60 },
    ],
    fallingPlatforms: [],
  },
  {
    worldWidth: 1600, worldHeight: 400, ground: { y: 368, h: 64 },
    platforms: [
      { x: 168, y: 224, w: 96, h: 16 }, { x: 400, y: 192, w: 96, h: 16 },
      { x: 648, y: 160, w: 96, h: 16 }, { x: 920, y: 192, w: 96, h: 16 },
      { x: 1168, y: 160, w: 96, h: 16 }, { x: 1416, y: 192, w: 96, h: 16 },
    ],
    hazards: [{ x: 256, y: 356, w: 48, h: 16 }, { x: 984, y: 356, w: 48, h: 16 }],
    playerSpawn: { x: 48, y: 304 }, exitPortal: { x: 1560, y: 320 },
    checkpoints: [{ x: 640, y: 304 }, { x: 1200, y: 304 }],
    coins: [
      { x: 144, y: 200 }, { x: 160, y: 200 }, { x: 368, y: 168 }, { x: 384, y: 168 },
      { x: 624, y: 136 }, { x: 640, y: 136 }, { x: 896, y: 168 }, { x: 912, y: 168 },
      { x: 1136, y: 136 }, { x: 1152, y: 136 }, { x: 1360, y: 168 }, { x: 1376, y: 168 },
    ],
    enemies: [
      { x: 300, y: 352, patrolStart: 200, patrolEnd: 400, type: 'basic' },
      { x: 700, y: 352, patrolStart: 600, patrolEnd: 800, type: 'basic' },
      { x: 1000, y: 352, patrolStart: 900, patrolEnd: 1100, type: 'basic' },
      { x: 1300, y: 352, patrolStart: 1200, patrolEnd: 1400, type: 'basic' },
    ],
    keys: [{ x: 800, y: 352, id: 'key-red' }],
    doors: [{ x: 1000, y: 352, keyId: 'key-red' }],
    movingPlatforms: [
      { x: 640, y: 360, path: [{ x: 580, y: 360 }, { x: 700, y: 360 }], speed: 80 },
    ],
    fallingPlatforms: [{ x: 1200, y: 364 }],
  },
  {
    worldWidth: 1600, worldHeight: 400, ground: { y: 368, h: 64 },
    platforms: [
      { x: 152, y: 256, w: 64, h: 16 }, { x: 312, y: 224, w: 64, h: 16 },
      { x: 472, y: 176, w: 64, h: 16 }, { x: 664, y: 224, w: 64, h: 16 },
      { x: 856, y: 256, w: 64, h: 16 }, { x: 1048, y: 224, w: 64, h: 16 },
      { x: 1240, y: 176, w: 64, h: 16 }, { x: 1432, y: 224, w: 64, h: 16 },
    ],
    hazards: [
      { x: 226, y: 356, w: 32, h: 16 }, { x: 418, y: 356, w: 32, h: 16 },
      { x: 794, y: 356, w: 32, h: 16 }, { x: 1156, y: 356, w: 32, h: 16 },
    ],
    playerSpawn: { x: 48, y: 304 }, exitPortal: { x: 1560, y: 320 },
    checkpoints: [{ x: 600, y: 304 }, { x: 1100, y: 304 }],
    coins: [
      { x: 144, y: 240 }, { x: 304, y: 192 }, { x: 464, y: 144 }, { x: 656, y: 192 },
      { x: 848, y: 240 }, { x: 1040, y: 192 }, { x: 1232, y: 144 }, { x: 1424, y: 192 },
      { x: 760, y: 160 }, { x: 920, y: 160 },
    ],
    enemies: [
      { x: 220, y: 352, patrolStart: 140, patrolEnd: 360, type: 'basic' },
      { x: 540, y: 352, patrolStart: 460, patrolEnd: 680, type: 'basic' },
      { x: 860, y: 352, patrolStart: 780, patrolEnd: 1000, type: 'basic' },
      { x: 1180, y: 352, patrolStart: 1100, patrolEnd: 1320, type: 'basic' },
      { x: 1450, y: 352, patrolStart: 1380, patrolEnd: 1540, type: 'basic' },
    ],
    keys: [{ x: 500, y: 352, id: 'key-a' }, { x: 1000, y: 352, id: 'key-b' }],
    doors: [{ x: 750, y: 352, keyId: 'key-a' }, { x: 1250, y: 352, keyId: 'key-b' }],
    movingPlatforms: [
      { x: 400, y: 360, path: [{ x: 350, y: 360 }, { x: 500, y: 360 }], speed: 70 },
      { x: 1000, y: 360, path: [{ x: 950, y: 360 }, { x: 1100, y: 360 }], speed: 70 },
    ],
    fallingPlatforms: [{ x: 700, y: 364 }, { x: 1350, y: 364 }],
  },
  {
    worldWidth: 1920, worldHeight: 400, ground: { y: 368, h: 64 },
    platforms: [
      { x: 152, y: 240, w: 64, h: 16 }, { x: 312, y: 176, w: 64, h: 16 },
      { x: 472, y: 128, w: 64, h: 16 }, { x: 632, y: 80, w: 64, h: 16 },
      { x: 824, y: 128, w: 64, h: 16 }, { x: 1016, y: 176, w: 64, h: 16 },
      { x: 1208, y: 128, w: 64, h: 16 }, { x: 1400, y: 80, w: 64, h: 16 },
      { x: 1592, y: 128, w: 64, h: 16 }, { x: 1784, y: 176, w: 64, h: 16 },
    ],
    hazards: [
      { x: 256, y: 356, w: 32, h: 16 }, { x: 576, y: 356, w: 32, h: 16 },
      { x: 896, y: 356, w: 32, h: 16 }, { x: 1216, y: 356, w: 32, h: 16 },
      { x: 1536, y: 356, w: 32, h: 16 },
    ],
    playerSpawn: { x: 48, y: 304 }, exitPortal: { x: 1880, y: 320 },
    checkpoints: [{ x: 600, y: 304 }, { x: 1100, y: 304 }, { x: 1600, y: 304 }],
    coins: [
      { x: 144, y: 224 }, { x: 304, y: 160 }, { x: 464, y: 112 }, { x: 624, y: 64 },
      { x: 816, y: 112 }, { x: 1008, y: 160 }, { x: 1200, y: 112 }, { x: 1392, y: 64 },
      { x: 1584, y: 112 }, { x: 1776, y: 160 }, { x: 960, y: 80 }, { x: 1120, y: 80 },
      { x: 1500, y: 80 }, { x: 1660, y: 80 },
    ],
    enemies: [
      { x: 250, y: 352, patrolStart: 160, patrolEnd: 360, type: 'basic' },
      { x: 560, y: 352, patrolStart: 480, patrolEnd: 640, type: 'basic' },
      { x: 900, y: 352, patrolStart: 800, patrolEnd: 1000, type: 'basic' },
      { x: 1200, y: 352, patrolStart: 1100, patrolEnd: 1320, type: 'basic' },
      { x: 1500, y: 352, patrolStart: 1400, patrolEnd: 1620, type: 'basic' },
      { x: 1780, y: 352, patrolStart: 1700, patrolEnd: 1860, type: 'basic' },
    ],
    keys: [{ x: 700, y: 352, id: 'key-final-a' }, { x: 1400, y: 352, id: 'key-final-b' }],
    doors: [{ x: 1000, y: 352, keyId: 'key-final-a' }, { x: 1700, y: 352, keyId: 'key-final-b' }],
    movingPlatforms: [
      { x: 500, y: 360, path: [{ x: 450, y: 360 }, { x: 600, y: 300 }], speed: 90 },
      { x: 1200, y: 360, path: [{ x: 1150, y: 360 }, { x: 1300, y: 300 }], speed: 90 },
      { x: 1700, y: 360, path: [{ x: 1650, y: 360 }, { x: 1800, y: 300 }], speed: 90 },
    ],
    fallingPlatforms: [{ x: 300, y: 364 }, { x: 900, y: 364 }, { x: 1500, y: 364 }],
  },
];

const dir = 'public/assets/data/levels';
levels.forEach((cfg, i) => {
  writeFileSync(`${dir}/level-${i + 1}.json`, JSON.stringify(cfg, null, 2));
  console.log(`Wrote level-${i + 1}.json`);
});
