export const PHYSICS = {
  GRAVITY: 600,
  RUN_SPEED: 200,
  JUMP_VELOCITY: -500,
  DOUBLE_JUMP_VELOCITY: -420,
  WALL_JUMP: { x: 280, y: -460 },
  DASH_SPEED: 650,
  DASH_DURATION: 180,
  DASH_COOLDOWN: 800,
  WALL_SLIDE_VELOCITY: 80,
  ACCELERATION: 1200,
  DECELERATION: 1800,
  COYOTE_TIME: 150,
  JUMP_BUFFER_TIME: 100,
  VARIABLE_JUMP_MULTIPLIER: 0.5,
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
