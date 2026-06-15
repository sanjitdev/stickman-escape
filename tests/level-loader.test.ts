import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'public', 'assets', 'data', 'levels');
const TILEMAP_DIR = join(__dirname, '..', 'public', 'assets', 'tilemaps');

const REQUIRED_CONFIG_FIELDS = ['playerSpawn', 'exitPortal', 'coins', 'enemies', 'keys', 'doors', 'movingPlatforms', 'fallingPlatforms', 'checkpoints'];
const REQUIRED_SPAWN_FIELDS = ['x', 'y'];

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function assertSpawnPoint(obj: unknown, label: string) {
  expect(obj, `${label} must be an object`).toBeTruthy();
  const point = obj as Record<string, unknown>;
  REQUIRED_SPAWN_FIELDS.forEach((f) => {
    expect(typeof point[f], `${label}.${f} must be a number`).toBe('number');
  });
}

describe('Level entity configs', () => {
  const files = readdirSync(DATA_DIR).filter((f: string) => f.endsWith('.json'));

  it('all 7 config files exist', () => {
    expect(files.length).toBe(7);
  });

  files.forEach((file) => {
    const levelNum = parseInt(file.replace('level-', '').replace('.json', ''));

    describe(`level-${levelNum}.json`, () => {
      const config = loadJson(join(DATA_DIR, file)) as Record<string, unknown>;

      it('has all required top-level fields', () => {
        REQUIRED_CONFIG_FIELDS.forEach((field) => {
          expect(config, `missing field: ${field}`).toHaveProperty(field);
        });
      });

      it('playerSpawn is a valid {x, y} point', () => {
        assertSpawnPoint(config.playerSpawn, 'playerSpawn');
      });

      it('exitPortal is a valid {x, y} point', () => {
        assertSpawnPoint(config.exitPortal, 'exitPortal');
      });

      it('coins is an array of {x, y} objects', () => {
        const coins = config.coins as unknown[];
        expect(Array.isArray(coins)).toBe(true);
        coins.forEach((c, i) => assertSpawnPoint(c, `coins[${i}]`));
      });

      it('enemies have required fields', () => {
        const enemies = config.enemies as Array<Record<string, unknown>>;
        enemies.forEach((e, i) => {
          expect(typeof e.patrolStart, `enemies[${i}].patrolStart`).toBe('number');
          expect(typeof e.patrolEnd, `enemies[${i}].patrolEnd`).toBe('number');
          expect(e.patrolEnd, `enemies[${i}] patrolEnd > patrolStart`).toBeGreaterThan(e.patrolStart as number);
        });
      });

      it('doors reference valid keyIds', () => {
        const keys = (config.keys as Array<{ id: string }>).map((k) => k.id);
        const doors = config.doors as Array<{ keyId: string }>;
        doors.forEach((d, i) => {
          expect(keys, `doors[${i}].keyId "${d.keyId}" not found in keys`).toContain(d.keyId);
        });
      });
    });
  });
});

describe('Tilemap files', () => {
  const files = readdirSync(TILEMAP_DIR).filter((f: string) => f.endsWith('.json'));

  it('all 7 tilemap files exist', () => {
    expect(files.length).toBe(7);
  });

  files.forEach((file) => {
    describe(file, () => {
      const map = loadJson(join(TILEMAP_DIR, file)) as Record<string, unknown>;

      it('has required Tiled fields', () => {
        ['width', 'height', 'tilewidth', 'tileheight', 'layers', 'tilesets'].forEach((f) => {
          expect(map).toHaveProperty(f);
        });
      });

      it('has exactly 3 layers (Background, Platforms, Hazards)', () => {
        const layers = map.layers as Array<{ name: string }>;
        expect(layers.length).toBe(3);
        expect(layers.map((l) => l.name)).toEqual(['Background', 'Platforms', 'Hazards']);
      });

      it('layer data length matches width × height', () => {
        const layers = map.layers as Array<{ data: unknown[]; width: number; height: number }>;
        layers.forEach((layer) => {
          expect(layer.data.length).toBe(layer.width * layer.height);
        });
      });
    });
  });
});
