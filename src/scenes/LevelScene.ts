import Phaser from 'phaser';
import { GAME, PHYSICS, STAR_THRESHOLDS, WORLDS } from '@/core/Config';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Coin } from '@/entities/Coin';
import { Key } from '@/entities/Key';
import { Door } from '@/entities/Door';
import { MovingPlatform } from '@/entities/MovingPlatform';
import { FallingPlatform } from '@/entities/FallingPlatform';
import { InputSystem } from '@/systems/InputSystem';
import { CameraSystem } from '@/systems/CameraSystem';
import { audioSystem } from '@/systems/AudioSystem';
import { saveSystem, type LevelStats } from '@/systems/SaveSystem';
import { HUD } from '@/ui/HUD';

// ─── Config types ─────────────────────────────────────────────────────────────

interface SpawnPoint { x: number; y: number; }
interface RectDef { x: number; y: number; w: number; h: number; }
interface GroundDef { y: number; h: number; }
interface EnemyConfig extends SpawnPoint { patrolStart: number; patrolEnd: number; type: string; }
interface MovingPlatformConfig extends SpawnPoint { path: Array<SpawnPoint>; speed: number; }
interface KeyConfig extends SpawnPoint { id: string; }
interface DoorConfig extends SpawnPoint { keyId: string; }
interface CheckpointConfig extends SpawnPoint { id?: string; }
interface SawConfig extends SpawnPoint { startX: number; endX: number; speed: number; }

interface LevelConfig {
  worldWidth: number;
  worldHeight: number;
  ground: GroundDef;
  platforms: RectDef[];
  hazards: RectDef[];
  playerSpawn: SpawnPoint;
  exitPortal: SpawnPoint;
  checkpoints: CheckpointConfig[];
  coins: SpawnPoint[];
  enemies: EnemyConfig[];
  keys: KeyConfig[];
  doors: DoorConfig[];
  movingPlatforms: MovingPlatformConfig[];
  fallingPlatforms: SpawnPoint[];
  saws?: SawConfig[];
}

const WORLD_COLORS = {
  ground:   [0x44773a, 0x444477, 0x774444] as const,
  platform: [0x335528, 0x334455, 0x554433] as const,
  bg:       [0x1a3a1a, 0x0b0b22, 0x150808] as const,
  hazard: 0xcc2222,
};

function worldIndex(level: number): 0 | 1 | 2 {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  return 2;
}

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private inputSys!: InputSystem;
  private camera!: CameraSystem;
  private hud!: HUD;
  private levelNumber!: number;
  private config!: LevelConfig;

  private solidGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private doors: Door[] = [];

  private elapsedMs = 0;
  private deaths = 0;
  private coinsCollected = 0;
  private totalCoins = 0;
  private activeCheckpoint: SpawnPoint | null = null;
  private levelComplete = false;

  constructor() {
    super('LevelScene');
  }

  init(data: { level: number }): void {
    this.levelNumber = data.level;
    this.elapsedMs = 0;
    this.deaths = 0;
    this.coinsCollected = 0;
    this.activeCheckpoint = null;
    this.levelComplete = false;
    this.doors = [];
  }

  create(): void {
    const raw = this.cache.json.get(`level-config-${this.levelNumber}`) as LevelConfig | null;
    if (!raw) {
      this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, `Level ${this.levelNumber} data not found.\nCheck browser console.`, {
        fontSize: '20px', color: '#ff4444', fontFamily: 'Arial, sans-serif', align: 'center',
      }).setOrigin(0.5);
      return;
    }
    this.config = raw;
    this.totalCoins = this.config.coins.length;

    const wi = worldIndex(this.levelNumber);
    this.cameras.main.setBackgroundColor(WORLD_COLORS.bg[wi]);

    this.buildLevel(wi);
    this.spawnEntities();
    this.createExitPortal();
    this.createCheckpoints();

    this.inputSys = new InputSystem(this);
    this.setupAudio();
    this.setupVirtualButtons();

    this.hud = new HUD(this);
    this.camera = new CameraSystem(this, this.config.worldWidth, this.config.worldHeight);
    this.camera.follow(this.player);
    this.camera.fadeIn();
  }

  // ─── Level geometry ────────────────────────────────────────────────────────

  private buildLevel(wi: 0 | 1 | 2): void {
    const { worldWidth, ground, platforms, hazards } = this.config;

    this.physics.world.setBounds(0, 0, worldWidth, this.config.worldHeight);
    this.solidGroup = this.physics.add.staticGroup();

    this.buildBackground(wi, worldWidth);

    // Ground floor
    this.addSolidRect(worldWidth / 2, ground.y, worldWidth, ground.h, WORLD_COLORS.ground[wi]);

    // Raised platforms
    platforms.forEach((p) => this.addSolidRect(p.x, p.y, p.w, p.h, WORLD_COLORS.platform[wi]));

    // Player must exist before any overlap callbacks are registered
    const { playerSpawn } = this.config;
    this.player = new Player(this, playerSpawn.x, playerSpawn.y);
    this.player.on('died', () => this.onPlayerDied());
    this.player.on('land', () => audioSystem.playSfx('sfx-land'));
    this.player.on('jump', () => audioSystem.playSfx('sfx-jump'));
    this.player.on('double-jump', () => audioSystem.playSfx('sfx-double-jump'));
    this.player.on('dash', () => audioSystem.playSfx('sfx-dash'));

    this.physics.add.collider(this.player, this.solidGroup);

    // Spike hazards — always sit on top of the ground surface
    const groundTop = ground.y - ground.h / 2;
    const SPIKE_H = 22;
    const SPIKE_W = 10;
    hazards.forEach((h) => {
      const gfx = this.add.graphics();
      const count = Math.max(1, Math.floor(h.w / SPIKE_W));
      for (let i = 0; i < count; i++) {
        const sx = h.x - h.w / 2 + i * SPIKE_W;
        gfx.fillStyle(0x881111);
        gfx.fillRect(sx, groundTop - 4, SPIKE_W, 4);
        gfx.fillStyle(0xdddddd);
        gfx.fillTriangle(sx + 1, groundTop, sx + SPIKE_W / 2, groundTop - SPIKE_H, sx + SPIKE_W - 1, groundTop);
        gfx.fillStyle(0xffffff, 0.4);
        gfx.fillTriangle(sx + 1, groundTop, sx + SPIKE_W / 2, groundTop - SPIKE_H, sx + SPIKE_W / 2 - 2, groundTop - SPIKE_H / 3);
        gfx.fillStyle(0xff2200, 0.25);
        gfx.fillCircle(sx + SPIKE_W / 2, groundTop - SPIKE_H + 4, 5);
      }
      const killH = SPIKE_H * 0.6;
      const zone = this.add.zone(h.x, groundTop - SPIKE_H + killH / 2, h.w, killH);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => this.player.die());
    });
  }

  private buildBackground(wi: 0 | 1 | 2, worldWidth: number): void {
    const { WIDTH, HEIGHT } = GAME;
    const rng = new Phaser.Math.RandomDataGenerator(['stickman-escape-bg']);

    if (wi === 0) {
      // ── Forest: deep sky gradient, distant mountains, mid trees, near trees ──
      this.cameras.main.setBackgroundColor(0x0d1b2a);

      // Sky gradient — two wide rects fading from midnight to dusk
      const skyGfx = this.add.graphics().setScrollFactor(0);
      skyGfx.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1a3a5c, 0x1a3a5c);
      skyGfx.fillRect(0, 0, WIDTH, HEIGHT * 0.6);

      // Stars (fixed, no scroll)
      const starGfx = this.add.graphics().setScrollFactor(0);
      starGfx.fillStyle(0xffffff);
      for (let i = 0; i < 120; i++) {
        const sx = rng.integerInRange(0, WIDTH);
        const sy = rng.integerInRange(0, HEIGHT * 0.5);
        const r = rng.realInRange(0.5, 1.5);
        starGfx.fillCircle(sx, sy, r);
      }

      // Moon (fixed)
      const moonGfx = this.add.graphics().setScrollFactor(0);
      moonGfx.fillStyle(0xf0e8c0);
      moonGfx.fillCircle(WIDTH * 0.82, HEIGHT * 0.12, 28);
      moonGfx.fillStyle(0x1a2d45);
      moonGfx.fillCircle(WIDTH * 0.82 - 10, HEIGHT * 0.12 - 8, 22);

      // Distant mountains (slow scroll)
      const mtn1 = this.add.graphics().setScrollFactor(0.08);
      mtn1.fillStyle(0x0e2233);
      for (let x = -100; x < worldWidth + 100; x += 200) {
        const h = rng.integerInRange(90, 170);
        mtn1.fillTriangle(x, HEIGHT * 0.68, x + 100, HEIGHT * 0.68 - h, x + 200, HEIGHT * 0.68);
      }

      // Mid mountains (medium scroll)
      const mtn2 = this.add.graphics().setScrollFactor(0.2);
      mtn2.fillStyle(0x122d1a);
      for (let x = -80; x < worldWidth + 80; x += 140) {
        const h = rng.integerInRange(60, 130);
        mtn2.fillTriangle(x, HEIGHT * 0.78, x + 70, HEIGHT * 0.78 - h, x + 140, HEIGHT * 0.78);
      }

      // Far tree silhouettes (medium-slow scroll)
      const trees1 = this.add.graphics().setScrollFactor(0.35);
      trees1.fillStyle(0x0d2210);
      for (let x = -30; x < worldWidth + 30; x += rng.integerInRange(40, 80)) {
        const tH = rng.integerInRange(50, 100);
        const tW = rng.integerInRange(20, 40);
        trees1.fillRect(x + tW / 2 - 4, HEIGHT * 0.82 - tH, 8, tH);
        trees1.fillTriangle(x, HEIGHT * 0.82 - tH * 0.5, x + tW / 2, HEIGHT * 0.82 - tH - 30, x + tW, HEIGHT * 0.82 - tH * 0.5);
        trees1.fillTriangle(x + 5, HEIGHT * 0.82 - tH * 0.6, x + tW / 2, HEIGHT * 0.82 - tH - 50, x + tW - 5, HEIGHT * 0.82 - tH * 0.6);
      }

      // Near tree silhouettes (fast scroll)
      const trees2 = this.add.graphics().setScrollFactor(0.6);
      trees2.fillStyle(0x081508);
      for (let x = -40; x < worldWidth + 40; x += rng.integerInRange(50, 110)) {
        const tH = rng.integerInRange(80, 160);
        const tW = rng.integerInRange(30, 55);
        trees2.fillRect(x + tW / 2 - 5, HEIGHT * 0.88 - tH, 10, tH);
        trees2.fillTriangle(x, HEIGHT * 0.88 - tH * 0.4, x + tW / 2, HEIGHT * 0.88 - tH - 40, x + tW, HEIGHT * 0.88 - tH * 0.4);
        trees2.fillTriangle(x + 8, HEIGHT * 0.88 - tH * 0.55, x + tW / 2, HEIGHT * 0.88 - tH - 65, x + tW - 8, HEIGHT * 0.88 - tH * 0.55);
      }

      // PA1 background art as mid-parallax layer
      const bgKey = 'bg-forest';
      if (this.textures.exists(bgKey) && this.textures.get(bgKey).frameTotal > 0) {
        const bgW = this.textures.getFrame(bgKey).realWidth;
        const bgH = this.textures.getFrame(bgKey).realHeight;
        if (bgW > 32) { // real image, not placeholder
          const tiles = Math.ceil(worldWidth / bgW) + 1;
          for (let i = 0; i < tiles; i++) {
            this.add.image(i * bgW + bgW / 2, HEIGHT - bgH / 2, bgKey)
              .setScrollFactor(0.45)
              .setAlpha(0.7);
          }
        }
      }

      this.spawnClouds(wi, WIDTH, HEIGHT);

    } else if (wi === 1) {
      // ── Cave: pitch black with glowing crystals, stalactites, stalagmites ──
      this.cameras.main.setBackgroundColor(0x04040c);

      // Ambient glow pockets (fixed)
      const glowGfx = this.add.graphics().setScrollFactor(0);
      const GLOWS: Array<[number, number, number, number]> = [
        [WIDTH * 0.2, HEIGHT * 0.3, 80, 0x1a0a44],
        [WIDTH * 0.6, HEIGHT * 0.15, 60, 0x0a2a44],
        [WIDTH * 0.85, HEIGHT * 0.45, 70, 0x2a0a22],
      ];
      GLOWS.forEach(([gx, gy, gr, gc]) => {
        for (let r = gr; r > 0; r -= 8) {
          const alpha = (1 - r / gr) * 0.15;
          glowGfx.fillStyle(gc, alpha);
          glowGfx.fillCircle(gx, gy, r);
        }
      });

      // Far stalactites (slow scroll)
      const stalaFar = this.add.graphics().setScrollFactor(0.1);
      stalaFar.fillStyle(0x0e0e22);
      for (let x = 30; x < worldWidth; x += rng.integerInRange(60, 120)) {
        const h = rng.integerInRange(30, 80);
        const w = rng.integerInRange(14, 28);
        stalaFar.fillTriangle(x - w / 2, 0, x + w / 2, 0, x, h);
      }

      // Near stalactites (medium scroll)
      const stalaNear = this.add.graphics().setScrollFactor(0.3);
      stalaNear.fillStyle(0x080818);
      for (let x = 0; x < worldWidth; x += rng.integerInRange(50, 100)) {
        const h = rng.integerInRange(50, 130);
        const w = rng.integerInRange(20, 40);
        stalaNear.fillTriangle(x - w / 2, 0, x + w / 2, 0, x, h);
      }

      // Glowing crystals on ceiling (medium scroll)
      const crystalColors = [0x4488ff, 0x44ffcc, 0xaa44ff, 0xff44aa];
      const crystalGfx = this.add.graphics().setScrollFactor(0.3);
      for (let x = 80; x < worldWidth; x += rng.integerInRange(150, 350)) {
        const c = crystalColors[rng.integerInRange(0, 3)];
        const cH = rng.integerInRange(20, 50);
        const cW = rng.integerInRange(8, 18);
        const cy = rng.integerInRange(0, 40);
        // Inner glow
        crystalGfx.fillStyle(c, 0.15);
        crystalGfx.fillCircle(x, cy + cH * 0.5, cH * 0.8);
        // Crystal body
        crystalGfx.fillStyle(c, 0.9);
        crystalGfx.fillTriangle(x - cW / 2, cy, x + cW / 2, cy, x, cy + cH);
        // Highlight
        crystalGfx.fillStyle(0xffffff, 0.5);
        crystalGfx.fillTriangle(x - cW / 4, cy, x, cy + 4, x - cW / 6, cy + cH * 0.4);
      }

      // Floor crystals (near scroll)
      const floorCrystalGfx = this.add.graphics().setScrollFactor(0.55);
      for (let x = 60; x < worldWidth; x += rng.integerInRange(100, 280)) {
        const c = crystalColors[rng.integerInRange(0, 3)];
        const cH = rng.integerInRange(15, 40);
        const cW = rng.integerInRange(6, 14);
        floorCrystalGfx.fillStyle(c, 0.6);
        floorCrystalGfx.fillTriangle(x - cW / 2, HEIGHT, x + cW / 2, HEIGHT, x, HEIGHT - cH);
      }

      // PA1 cave background art
      const caveBg = 'bg-cave';
      if (this.textures.exists(caveBg)) {
        const bgW = this.textures.getFrame(caveBg).realWidth;
        const bgH = this.textures.getFrame(caveBg).realHeight;
        if (bgW > 32) {
          const tiles = Math.ceil(worldWidth / bgW) + 1;
          for (let i = 0; i < tiles; i++) {
            this.add.image(i * bgW + bgW / 2, HEIGHT - bgH / 2, caveBg)
              .setScrollFactor(0.35)
              .setAlpha(0.5);
          }
        }
      }

      this.spawnClouds(wi, WIDTH, HEIGHT);

    } else {
      // ── Fortress: dark storm sky, castle towers, lightning bolts ──
      this.cameras.main.setBackgroundColor(0x100608);

      // Storm sky gradient
      const skyGfx2 = this.add.graphics().setScrollFactor(0);
      skyGfx2.fillGradientStyle(0x100608, 0x100608, 0x1e0c10, 0x1e0c10);
      skyGfx2.fillRect(0, 0, WIDTH, HEIGHT * 0.75);

      // Far clouds / smoke (slow scroll)
      const cloudGfx = this.add.graphics().setScrollFactor(0.12);
      cloudGfx.fillStyle(0x1a0a0a, 0.7);
      for (let x = -60; x < worldWidth + 60; x += rng.integerInRange(160, 320)) {
        const cy2 = rng.integerInRange(10, HEIGHT * 0.4);
        const cw2 = rng.integerInRange(100, 220);
        const ch2 = rng.integerInRange(30, 70);
        cloudGfx.fillEllipse(x, cy2, cw2, ch2);
      }

      // Distant castle towers (slow scroll)
      const towerFar = this.add.graphics().setScrollFactor(0.15);
      towerFar.fillStyle(0x1a0a0c);
      for (let x = 80; x < worldWidth; x += rng.integerInRange(280, 500)) {
        const tw = rng.integerInRange(40, 70);
        const th = rng.integerInRange(120, 220);
        // Tower body
        towerFar.fillRect(x - tw / 2, HEIGHT * 0.5 - th, tw, th);
        // Battlements
        for (let bx = x - tw / 2; bx < x + tw / 2; bx += 12) {
          towerFar.fillRect(bx, HEIGHT * 0.5 - th - 16, 8, 16);
        }
        // Arrow slits
        towerFar.fillStyle(0x040204);
        towerFar.fillRect(x - 3, HEIGHT * 0.5 - th * 0.7, 6, 14);
        towerFar.fillRect(x - 3, HEIGHT * 0.5 - th * 0.4, 6, 14);
        towerFar.fillStyle(0x1a0a0c);
      }

      // Mid-distance walls (medium scroll)
      const wallGfx = this.add.graphics().setScrollFactor(0.3);
      wallGfx.fillStyle(0x120608);
      for (let x = -50; x < worldWidth + 50; x += rng.integerInRange(400, 700)) {
        const wH = rng.integerInRange(60, 110);
        wallGfx.fillRect(x, HEIGHT * 0.72 - wH, 200, wH);
        for (let bx = x; bx < x + 200; bx += 14) {
          wallGfx.fillRect(bx, HEIGHT * 0.72 - wH - 12, 10, 12);
        }
      }

      // Lightning bolts (fixed decorative, not animated)
      const boltGfx = this.add.graphics().setScrollFactor(0);
      const boltPositions = [WIDTH * 0.15, WIDTH * 0.55, WIDTH * 0.88];
      boltPositions.forEach((bx2) => {
        boltGfx.lineStyle(2, 0xffffff, 0.35);
        let cx = bx2, cy = 40;
        boltGfx.beginPath();
        boltGfx.moveTo(cx, cy);
        for (let seg = 0; seg < 6; seg++) {
          cx += rng.integerInRange(-18, 18);
          cy += rng.integerInRange(30, 55);
          boltGfx.lineTo(cx, cy);
        }
        boltGfx.strokePath();
      });

      // PA1 fortress background art
      const fortBg = 'bg-fortress';
      if (this.textures.exists(fortBg)) {
        const bgW = this.textures.getFrame(fortBg).realWidth;
        const bgH = this.textures.getFrame(fortBg).realHeight;
        if (bgW > 32) {
          const tiles = Math.ceil(worldWidth / bgW) + 1;
          for (let i = 0; i < tiles; i++) {
            this.add.image(i * bgW + bgW / 2, HEIGHT - bgH / 2, fortBg)
              .setScrollFactor(0.25)
              .setAlpha(0.55);
          }
        }
      }

      this.spawnClouds(wi, WIDTH, HEIGHT);
    }
  }

  // ─── Animated clouds (per-world style, screen-space) ──────────────────────

  private spawnClouds(wi: 0 | 1 | 2, WIDTH: number, HEIGHT: number): void {
    type Bump = { x: number; r: number; cy: number };

    /**
     * Realistic cumulus silhouette:
     *   - Evenly-spaced bumps with a Gaussian height envelope (tallest at centre)
     *   - Count auto-scales with width so all sizes look natural
     *   - Three fully-opaque passes: shadow base → white body → highlight caps
     *   - Flat base rectangle hides circle bottoms — clean horizontal base line
     */
    const drawCumulus = (
      gfx: Phaser.GameObjects.Graphics,
      w: number, h: number,
      shadowColor: number, bodyColor: number,
    ) => {
      const baseH   = h * 0.65;
      const nBumps  = Math.max(5, Math.round(w / 38));
      const bumps: Bump[] = [];

      for (let i = 0; i < nBumps; i++) {
        const t  = (i + 0.5) / nBumps;          // even spacing 0→1
        const x  = (t - 0.5) * w * 0.88;
        const d  = (t - 0.5) * 2;               // −1 to +1
        const env = Math.exp(-d * d * 2.2);     // Gaussian: 1 at centre, 0.11 at edges
        const r  = h * (0.20 + env * 0.24);     // r: 0.20h … 0.44h
        bumps.push({ x, r, cy: baseH - r * 0.72 });
      }

      // Pass 1 — shadow underside (slightly lower + larger)
      gfx.fillStyle(shadowColor);
      bumps.forEach(b => gfx.fillCircle(b.x, b.cy + b.r * 0.22, b.r * 0.90));
      gfx.fillRect(-w * 0.43, baseH - h * 0.14, w * 0.86, h * 0.18);

      // Pass 2 — solid cloud body
      gfx.fillStyle(bodyColor);
      bumps.forEach(b => gfx.fillCircle(b.x, b.cy, b.r));
      gfx.fillRect(-w * 0.43, baseH - h * 0.12, w * 0.86, h * 0.16);

      // Flat base cover (crisp bottom edge)
      gfx.fillStyle(bodyColor);
      gfx.fillRect(-w * 0.43, baseH - h * 0.04, w * 0.86, h * 0.08);
    };

    const drawMist = (gfx: Phaser.GameObjects.Graphics, w: number, h: number) => {
      gfx.fillStyle(0xffffff);
      gfx.fillEllipse(0, 0, w, h * 0.35);
      gfx.fillEllipse(w * 0.08, h * 0.14, w * 0.78, h * 0.20);
    };

    const spawn = (
      alpha: number, sc: number, bc: number,
      sx: number, cy: number, w: number, h: number, dur: number, delay: number,
    ) => {
      const gfx = this.add.graphics().setScrollFactor(0).setAlpha(alpha);
      drawCumulus(gfx, w, h, sc, bc);
      gfx.x = sx; gfx.y = cy;
      this.tweens.add({ targets: gfx, x: { from: sx, to: -w }, duration: dur, delay, repeat: -1, ease: 'Linear', onRepeat: () => { gfx.x = WIDTH + w; } });
    };
    const spawnMist = (alpha: number, sx: number, cy: number, w: number, h: number, dur: number, delay: number) => {
      const gfx = this.add.graphics().setScrollFactor(0).setAlpha(alpha);
      drawMist(gfx, w, h);
      gfx.x = sx; gfx.y = cy;
      this.tweens.add({ targets: gfx, x: { from: sx, to: -w }, duration: dur, delay, repeat: -1, ease: 'Linear', onRepeat: () => { gfx.x = WIDTH + w; } });
    };

    if (wi === 0) {
      // Forest — sunlit cumulus: cool-grey shadow, near-white body
      const S = 0xb8ccd8, B = 0xf8fcff;
      [
        [HEIGHT * 0.08, 220, 70,  28000,  0,    0.78],
        [HEIGHT * 0.13, 160, 52,  34000,  5000, 0.72],
        [HEIGHT * 0.06, 290, 92,  40000, 12000, 0.80],
        [HEIGHT * 0.17, 175, 58,  31000, 20000, 0.74],
        [HEIGHT * 0.05, 135, 44,  37000,  8000, 0.68],
        [HEIGHT * 0.11, 340, 108, 45000,  3000, 0.82],
        [HEIGHT * 0.21, 255, 82,  22000,  2000, 0.76],
        [HEIGHT * 0.26, 200, 64,  28000,  9000, 0.70],
        [HEIGHT * 0.16, 380, 118, 18000, 16000, 0.78],
        [HEIGHT * 0.23, 215, 70,  25000,  4000, 0.74],
      ].forEach(([y, w, h, dur, delay, a]) => spawn(a, S, B, WIDTH + w, y, w, h, dur, delay));

    } else if (wi === 1) {
      // Cave — thin white mist wisps
      [
        [HEIGHT * 0.55, 320, 52, 35000,  0],
        [HEIGHT * 0.65, 260, 40, 42000,  7000],
        [HEIGHT * 0.72, 400, 60, 50000, 14000],
        [HEIGHT * 0.50, 280, 46, 38000,  4000],
        [HEIGHT * 0.60, 360, 56, 46000, 10000],
        [HEIGHT * 0.78, 500, 68, 55000, 20000],
        [HEIGHT * 0.45, 220, 38, 32000, 17000],
      ].forEach(([y, w, h, dur, delay]) => spawnMist(0.18, WIDTH + w, y, w, h, dur, delay));

    } else {
      // Fortress — heavy storm clouds: dark shadow, gunmetal body — same size range as forest
      const S = 0x383840, B = 0xc4c8d0;
      [
        [HEIGHT * 0.05, 200, 65,  16000,  0,    0.86],
        [HEIGHT * 0.13, 270, 88,  20000,  3000, 0.80],
        [HEIGHT * 0.07, 165, 54,  14000,  8000, 0.88],
        [HEIGHT * 0.16, 310, 100, 22000,  5000, 0.78],
        [HEIGHT * 0.24, 230, 74,  10000,  1000, 0.92],
        [HEIGHT * 0.32, 185, 60,  12000,  6000, 0.88],
        [HEIGHT * 0.18, 350, 112,  9000, 11000, 0.90],
        [HEIGHT * 0.36, 215, 70,  11000,  2000, 0.86],
        [HEIGHT * 0.28, 145, 48,  13000, 15000, 0.84],
      ].forEach(([y, w, h, dur, delay, a]) => spawn(a, S, B, WIDTH + w, y, w, h, dur, delay));
    }
  }

  private addSolidRect(x: number, y: number, w: number, h: number, color: number): void {
    const rect = this.add.rectangle(x, y, w, h, color);
    this.physics.add.existing(rect, true);
    this.solidGroup.add(rect);
  }

  // ─── Entity spawning ──────────────────────────────────────────────────────

  private spawnEntities(): void {
    this.spawnCoins();
    this.spawnEnemies();
    this.spawnKeys();
    this.spawnDoors();
    this.spawnMovingPlatforms();
    this.spawnFallingPlatforms();
    this.spawnSaws();
  }

  private spawnSaws(): void {
    (this.config.saws ?? []).forEach((s) => {
      // Animated saw sprite
      const saw = this.add.sprite(s.x, s.y, 'trap-saw', 0);
      if (this.anims.exists('trap-saw-spin')) saw.anims.play('trap-saw-spin', true);

      // Invisible physics zone rides with the saw via tween onUpdate
      const zone = this.add.zone(s.x, s.y, 30, 30);
      this.physics.add.existing(zone, true);

      const dist = Math.abs(s.endX - s.startX);
      const duration = (dist / s.speed) * 1000;

      this.tweens.add({
        targets: saw,
        x: { value: [s.startX, s.endX] },
        duration,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          (zone.body as Phaser.Physics.Arcade.StaticBody).reset(saw.x, saw.y);
        },
      });

      this.physics.add.overlap(this.player, zone, () => this.player.die());
    });
  }

  private spawnCoins(): void {
    this.config.coins.forEach((c) => {
      const coin = new Coin(this, c.x, c.y);
      this.physics.add.overlap(this.player, coin, () => {
        if (!coin.active) return;
        coin.collect();
        this.coinsCollected++;
        audioSystem.playSfx('sfx-coin');
      });
    });
  }

  private spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group({ classType: Enemy });
    this.config.enemies.forEach((e) => {
      const enemy = new Enemy(this, e.x, e.y, e.patrolStart, e.patrolEnd);
      this.enemyGroup.add(enemy);
      this.physics.add.collider(enemy, this.solidGroup);
      this.physics.add.overlap(this.player, enemy, () => {
        const body = this.player.arcadeBody;
        if (body.velocity.y > 0 && this.player.y < enemy.y - 10) {
          enemy.stomp();
          this.player.setVelocityY(PHYSICS.JUMP_VELOCITY * 0.6);
          audioSystem.playSfx('sfx-stomp');
        } else if (!this.player.isInvincible) {
          this.player.die();
        }
      });
    });
  }

  private spawnKeys(): void {
    this.config.keys.forEach((kCfg) => {
      const key = new Key(this, kCfg.x, kCfg.y, kCfg.id);
      this.physics.add.overlap(this.player, key, () => {
        if (!key.active) return;
        key.collect();
        audioSystem.playSfx('sfx-key');
        const door = this.doors.find((d) => d.keyId === kCfg.id);
        door?.open();
        if (door) audioSystem.playSfx('sfx-door');
      });
    });
  }

  private spawnDoors(): void {
    this.config.doors.forEach((d) => {
      const door = new Door(this, d.x, d.y, d.keyId);
      this.doors.push(door);
      this.physics.add.collider(this.player, door);
    });
  }

  private spawnMovingPlatforms(): void {
    this.config.movingPlatforms.forEach((mp) => {
      const platform = new MovingPlatform(this, mp.x, mp.y, mp.path, mp.speed);
      this.physics.add.collider(this.player, platform);
    });
  }

  private spawnFallingPlatforms(): void {
    this.config.fallingPlatforms.forEach((fp) => {
      const platform = new FallingPlatform(this, fp.x, fp.y);
      this.physics.add.collider(this.player, platform, () => platform.trigger());
    });
  }

  private createExitPortal(): void {
    const { exitPortal } = this.config;
    const portal = this.add.image(exitPortal.x, exitPortal.y, 'portal');
    this.physics.add.existing(portal, true);
    this.tweens.add({
      targets: portal, y: exitPortal.y - 8,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.physics.add.overlap(this.player, portal, () => {
      if (!this.levelComplete) this.completeLevel();
    });
  }

  private createCheckpoints(): void {
    this.config.checkpoints.forEach((cp) => {
      const sprite = this.add.image(cp.x, cp.y, 'checkpoint');
      const zone = this.add.zone(cp.x, cp.y, 32, 48);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => {
        if (this.activeCheckpoint?.x === cp.x) return;
        this.activeCheckpoint = { x: cp.x, y: cp.y };
        sprite.setTint(0x00ff88);
        audioSystem.playSfx('sfx-checkpoint');
        this.hud.showCheckpoint();
      });
    });
  }

  // ─── Audio / Input / Touch ────────────────────────────────────────────────

  private setupAudio(): void {
    const world = WORLDS.find((w) => w.levels.includes(this.levelNumber as never));
    if (world) {
      audioSystem.init(this, saveSystem.settings.musicVolume, saveSystem.settings.sfxVolume);
      audioSystem.playMusic(world.music);
    }
  }

  private setupVirtualButtons(): void {
    if (!this.sys.game.device.input.touch) return;
    const y = GAME.HEIGHT - 60;
    const style = { fontSize: '28px', color: '#ffffff', fontFamily: 'Arial, sans-serif' };
    const makeBtn = (x: number, label: string, down: () => void, up: () => void) => {
      const btn = this.add.text(x, y, label, style)
        .setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0.7).setInteractive();
      btn.on('pointerdown', down).on('pointerup', up).on('pointerout', up);
    };
    makeBtn(60, '←', () => { this.inputSys.touchLeft = true; }, () => { this.inputSys.touchLeft = false; });
    makeBtn(130, '→', () => { this.inputSys.touchRight = true; }, () => { this.inputSys.touchRight = false; });
    makeBtn(GAME.WIDTH - 130, '⬆', () => { this.inputSys.touchJump = true; }, () => { this.inputSys.touchJump = false; });
    makeBtn(GAME.WIDTH - 60, '⚡', () => { this.inputSys.touchDash = true; }, () => { this.inputSys.touchDash = false; });
  }

  // ─── Game events ──────────────────────────────────────────────────────────

  private onPlayerDied(): void {
    this.deaths++;
    this.camera.shake();
    audioSystem.playSfx('sfx-death');
    this.time.delayedCall(800, () => {
      const spawn = this.activeCheckpoint ?? this.config.playerSpawn;
      this.player.respawn(spawn.x, spawn.y);
    });
  }

  private completeLevel(): void {
    this.levelComplete = true;
    audioSystem.playSfx('sfx-portal');
    const stats = this.buildStats();
    saveSystem.updateLevelStats(this.levelNumber, stats);
    if (this.levelNumber < GAME.TOTAL_LEVELS) saveSystem.unlockLevel(this.levelNumber + 1);
    this.camera.fadeOut(500, () => {
      this.scene.start('VictoryScene', { level: this.levelNumber, stats });
    });
  }

  private buildStats(): LevelStats {
    const { THREE, TWO } = STAR_THRESHOLDS;
    const coinRatio = this.totalCoins > 0 ? this.coinsCollected / this.totalCoins : 1;
    const stars =
      this.deaths <= THREE.maxDeaths && coinRatio >= THREE.minCoinRatio ? 3
      : this.deaths <= TWO.maxDeaths && coinRatio >= TWO.minCoinRatio ? 2
      : 1;
    return {
      bestTime: this.elapsedMs,
      deaths: this.deaths,
      coinsCollected: this.coinsCollected,
      totalCoins: this.totalCoins,
      stars,
    };
  }

  // ─── Game loop ────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.levelComplete || !this.player) return;

    this.elapsedMs += delta;
    this.inputSys.update(delta);

    const state = this.inputSys.state;
    this.player.update(delta, state);
    (this.enemyGroup?.getChildren() as Enemy[]).forEach((e) => e.update(delta));
    this.hud.update(this.elapsedMs, this.coinsCollected, this.totalCoins, this.deaths);

    if (state.pause) {
      this.scene.pause('LevelScene');
      this.scene.launch('PauseScene', { level: this.levelNumber });
    }
  }
}
