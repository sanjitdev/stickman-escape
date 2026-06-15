export const PHYSICS = {
  GRAVITY: 1800,
  RUN_SPEED: 220,
  JUMP_VELOCITY: -900,
  DOUBLE_JUMP_VELOCITY: -780,
  WALL_JUMP: { x: 320, y: -860 },
  DASH_SPEED: 700,
  DASH_DURATION: 160,
  DASH_COOLDOWN: 700,
  WALL_SLIDE_VELOCITY: 100,
  ACCELERATION: 1400,
  DECELERATION: 2000,
  COYOTE_TIME: 120,
  JUMP_BUFFER_TIME: 100,
  // Applied as extra body gravity (additive on top of world gravity)
  FALL_GRAVITY_MULT: 2.0,   // faster descent — snappy landing
  LOW_JUMP_GRAVITY_MULT: 1.5, // faster cut when button released early
} as const;

export const GAME = {
  WIDTH: 960,
  HEIGHT: 544,
  TILE_SIZE: 16,
  TOTAL_LEVELS: 7,
} as const;

export const WORLDS = [
  { id: 1, name: 'Forest', music: 'music-forest' as const, levels: [1, 2] },
  { id: 2, name: 'Cave', music: 'music-cave' as const, levels: [3, 4] },
  { id: 3, name: 'Fortress', music: 'music-fortress' as const, levels: [5, 6, 7] },
] as const;

export const STAR_THRESHOLDS = {
  THREE: { maxDeaths: 0, minCoinRatio: 1.0 },
  TWO: { maxDeaths: 3, minCoinRatio: 0.6 },
} as const;

export const SAVE_KEY = 'stickman-escape-save';

export const PLAYER = {
  SPRITE_WIDTH: 32,
  SPRITE_HEIGHT: 32,
  BODY_WIDTH: 18,
  BODY_HEIGHT: 26,
} as const;
