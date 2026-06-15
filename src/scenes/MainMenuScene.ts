import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { Button } from '@/ui/Button';
import { audioSystem } from '@/systems/AudioSystem';
import { saveSystem } from '@/systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create(): void {
    audioSystem.init(this, saveSystem.settings.musicVolume, saveSystem.settings.sfxVolume);
    audioSystem.playMusic('music-forest');

    const { WIDTH, HEIGHT } = GAME;

    // ── Sky gradient background ──────────────────────────────────────────────
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x050d1a, 0x050d1a, 0x0a2240, 0x0a2240);
    sky.fillRect(0, 0, WIDTH, HEIGHT);

    // ── Stars ────────────────────────────────────────────────────────────────
    const stars = this.add.graphics();
    const rng = new Phaser.Math.RandomDataGenerator(['menu-stars']);
    for (let i = 0; i < 200; i++) {
      const sx = rng.integerInRange(0, WIDTH);
      const sy = rng.integerInRange(0, HEIGHT * 0.7);
      const r  = rng.realInRange(0.4, 1.8);
      const a  = rng.realInRange(0.4, 1.0);
      stars.fillStyle(0xffffff, a);
      stars.fillCircle(sx, sy, r);
    }
    // Slow twinkle on the whole star layer
    this.tweens.add({
      targets: stars,
      alpha: { from: 0.7, to: 1.0 },
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── Moon ─────────────────────────────────────────────────────────────────
    const moon = this.add.graphics();
    moon.fillStyle(0xfef0c8);
    moon.fillCircle(WIDTH * 0.82, HEIGHT * 0.12, 40);
    moon.fillStyle(0x0a1830);  // bite out
    moon.fillCircle(WIDTH * 0.82 - 14, HEIGHT * 0.12 - 10, 32);
    // Halo
    const halo = this.add.graphics();
    for (let r = 60; r > 40; r -= 4) {
      halo.fillStyle(0xfef0c8, (1 - (r - 40) / 20) * 0.08);
      halo.fillCircle(WIDTH * 0.82, HEIGHT * 0.12, r);
    }

    // ── Distant mountains ────────────────────────────────────────────────────
    const mtnFar = this.add.graphics();
    mtnFar.fillStyle(0x0c2040);
    for (let x = -80; x < WIDTH + 80; x += 200) {
      const mh = rng.integerInRange(90, 170);
      mtnFar.fillTriangle(x, HEIGHT * 0.68, x + 100, HEIGHT * 0.68 - mh, x + 200, HEIGHT * 0.68);
    }

    const mtnNear = this.add.graphics();
    mtnNear.fillStyle(0x071828);
    for (let x = -60; x < WIDTH + 60; x += 150) {
      const mh = rng.integerInRange(55, 120);
      mtnNear.fillTriangle(x, HEIGHT * 0.76, x + 75, HEIGHT * 0.76 - mh, x + 150, HEIGHT * 0.76);
    }

    // ── Tree silhouettes ─────────────────────────────────────────────────────
    const treeFar = this.add.graphics();
    treeFar.fillStyle(0x071410);
    for (let x = -20; x < WIDTH + 20; x += rng.integerInRange(35, 70)) {
      const th = rng.integerInRange(55, 110), tw = rng.integerInRange(20, 38);
      treeFar.fillRect(x + tw / 2 - 4, HEIGHT * 0.83 - th, 8, th);
      treeFar.fillTriangle(x, HEIGHT * 0.83 - th * 0.45, x + tw / 2, HEIGHT * 0.83 - th - 28, x + tw, HEIGHT * 0.83 - th * 0.45);
      treeFar.fillTriangle(x + 4, HEIGHT * 0.83 - th * 0.6, x + tw / 2, HEIGHT * 0.83 - th - 48, x + tw - 4, HEIGHT * 0.83 - th * 0.6);
    }

    const treeNear = this.add.graphics();
    treeNear.fillStyle(0x030a06);
    for (let x = -30; x < WIDTH + 30; x += rng.integerInRange(50, 100)) {
      const th = rng.integerInRange(90, 200), tw = rng.integerInRange(32, 60);
      treeNear.fillRect(x + tw / 2 - 6, HEIGHT - th, 12, th);
      treeNear.fillTriangle(x, HEIGHT - th * 0.38, x + tw / 2, HEIGHT - th - 40, x + tw, HEIGHT - th * 0.38);
      treeNear.fillTriangle(x + 8, HEIGHT - th * 0.55, x + tw / 2, HEIGHT - th - 65, x + tw - 8, HEIGHT - th * 0.55);
    }

    // ── Ground fog strip ─────────────────────────────────────────────────────
    const fog = this.add.graphics();
    for (let i = 0; i < 6; i++) {
      fog.fillStyle(0x1a4060, 0.06 * (6 - i));
      fog.fillRect(0, HEIGHT * 0.82 + i * 12, WIDTH, 20);
    }

    // ── Drifting clouds ───────────────────────────────────────────────────────
    this.spawnMenuClouds(WIDTH, HEIGHT);

    // ── PA1 background art ────────────────────────────────────────────────────
    if (this.textures.exists('bg-forest')) {
      const bgW = this.textures.getFrame('bg-forest').realWidth;
      const bgH = this.textures.getFrame('bg-forest').realHeight;
      if (bgW > 32) {
        const img = this.add.image(WIDTH / 2, HEIGHT - bgH / 2, 'bg-forest')
          .setDisplaySize(WIDTH, bgH)
          .setAlpha(0.55);
        // slow bob
        this.tweens.add({ targets: img, y: HEIGHT - bgH / 2 + 4, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }

    // ── Floating fruit particles ──────────────────────────────────────────────
    if (this.textures.exists('fruit-apple') && this.textures.get('fruit-apple').frameTotal > 2) {
      this.add.particles(0, 0, 'fruit-apple', {
        frame: { frames: [0, 4, 8, 12], cycle: true },
        x: { min: 0, max: WIDTH },
        y: { min: -20, max: -20 },
        speedY: { min: 30, max: 80 },
        speedX: { min: -15, max: 15 },
        lifespan: { min: 5000, max: 9000 },
        scale: { start: 0.7, end: 0.3 },
        alpha: { start: 0.8, end: 0 },
        rotate: { min: -180, max: 180 },
        frequency: 700,
        quantity: 1,
      });
    }

    // ── Title ────────────────────────────────────────────────────────────────
    // Glow layer
    const titleGlow = this.add.text(WIDTH / 2, HEIGHT * 0.28, 'STICKMAN ESCAPE', {
      fontSize: '58px',
      color: '#4488ff',
      fontFamily: 'Arial Black, Arial, sans-serif',
    }).setOrigin(0.5).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: titleGlow, alpha: { from: 0.15, to: 0.45 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Shadow
    this.add.text(WIDTH / 2 + 4, HEIGHT * 0.28 + 5, 'STICKMAN ESCAPE', {
      fontSize: '58px',
      color: '#001133',
      fontFamily: 'Arial Black, Arial, sans-serif',
    }).setOrigin(0.5).setAlpha(0.7);

    // Main title
    const title = this.add.text(WIDTH / 2, HEIGHT * 0.28, 'STICKMAN ESCAPE', {
      fontSize: '58px',
      color: '#ffffff',
      fontFamily: 'Arial Black, Arial, sans-serif',
      stroke: '#1a3a6e',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0);

    // Subtitle
    const sub = this.add.text(WIDTH / 2, HEIGHT * 0.28 + 58, 'A PLATFORMER ADVENTURE', {
      fontSize: '16px',
      color: '#88bbdd',
      fontFamily: 'Arial, sans-serif',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    // ── Decorative horizontal rules ───────────────────────────────────────────
    const rule = this.add.graphics().setAlpha(0);
    rule.lineStyle(1, 0x4488ff, 0.5);
    rule.lineBetween(WIDTH / 2 - 260, HEIGHT * 0.28 + 76, WIDTH / 2 - 20, HEIGHT * 0.28 + 76);
    rule.lineBetween(WIDTH / 2 + 20,  HEIGHT * 0.28 + 76, WIDTH / 2 + 260, HEIGHT * 0.28 + 76);

    // ── Buttons ───────────────────────────────────────────────────────────────
    const btnPlay = new Button(this, WIDTH / 2, HEIGHT * 0.56, {
      text: '▶  PLAY',
      onClick: () => this.cameras.main.fadeOut(300, 0, 0, 0, () => this.scene.start('LevelSelectScene')),
      width: 220,
      height: 54,
      fontSize: 22,
    });
    btnPlay.setAlpha(0);

    const btnSettings = new Button(this, WIDTH / 2, HEIGHT * 0.56 + 72, {
      text: '⚙  SETTINGS',
      onClick: () => this.cameras.main.fadeOut(300, 0, 0, 0, () => this.scene.start('SettingsScene')),
      width: 220,
      height: 54,
      fontSize: 22,
    });
    btnSettings.setAlpha(0);

    // ── Version tag ───────────────────────────────────────────────────────────
    this.add.text(WIDTH - 8, HEIGHT - 8, 'v1.0', {
      fontSize: '12px', color: '#334455', fontFamily: 'Arial, sans-serif',
    }).setOrigin(1);

    // ── Entrance animation ────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600);

    this.tweens.add({ targets: title,       alpha: 1,    y: HEIGHT * 0.28 - 12, duration: 700, delay: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sub,         alpha: 1,    duration: 600, delay: 600, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: rule,        alpha: 1,    duration: 500, delay: 700 });
    this.tweens.add({ targets: btnPlay,     alpha: 1,    y: HEIGHT * 0.56 - 8, duration: 500, delay: 800, ease: 'Back.easeOut' });
    this.tweens.add({ targets: btnSettings, alpha: 1,    y: HEIGHT * 0.56 + 64, duration: 500, delay: 950, ease: 'Back.easeOut' });

    // Idle float on title
    this.tweens.add({ targets: title, y: HEIGHT * 0.28 - 8, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 1000 });
  }

  private spawnMenuClouds(WIDTH: number, HEIGHT: number): void {
    type Bump = { x: number; r: number; cy: number };

    const drawCumulus = (gfx: Phaser.GameObjects.Graphics, w: number, h: number) => {
      const baseH  = h * 0.65;
      const nBumps = Math.max(5, Math.round(w / 38));
      const bumps: Bump[] = [];
      for (let i = 0; i < nBumps; i++) {
        const t   = (i + 0.5) / nBumps;
        const x   = (t - 0.5) * w * 0.88;
        const d   = (t - 0.5) * 2;
        const env = Math.exp(-d * d * 2.2);
        const r   = h * (0.20 + env * 0.24);
        bumps.push({ x, r, cy: baseH - r * 0.72 });
      }
      // Shadow
      gfx.fillStyle(0xb0c4d8);
      bumps.forEach(b => gfx.fillCircle(b.x, b.cy + b.r * 0.22, b.r * 0.90));
      gfx.fillRect(-w * 0.43, baseH - h * 0.14, w * 0.86, h * 0.18);
      // Solid body
      gfx.fillStyle(0xf8fcff);
      bumps.forEach(b => gfx.fillCircle(b.x, b.cy, b.r));
      gfx.fillRect(-w * 0.43, baseH - h * 0.12, w * 0.86, h * 0.16);
      // Flat base
      gfx.fillStyle(0xf8fcff);
      gfx.fillRect(-w * 0.43, baseH - h * 0.04, w * 0.86, h * 0.08);
    };

    [
      [HEIGHT * 0.08, 220, 70,  38000,  0,     0.80],
      [HEIGHT * 0.14, 165, 53,  28000,  8000,  0.74],
      [HEIGHT * 0.06, 310, 98,  48000, 16000,  0.82],
      [HEIGHT * 0.19, 185, 60,  32000,  4000,  0.76],
      [HEIGHT * 0.11, 370, 116, 55000, 22000,  0.84],
      [HEIGHT * 0.23, 215, 68,  25000, 11000,  0.78],
    ].forEach(([y, w, h, dur, delay, alpha]) => {
      const gfx = this.add.graphics().setAlpha(alpha);
      drawCumulus(gfx, w, h);
      gfx.x = WIDTH + w;
      gfx.y = y;
      this.tweens.add({
        targets: gfx,
        x: { from: WIDTH + w, to: -w },
        duration: dur,
        delay,
        repeat: -1,
        ease: 'Linear',
        onRepeat: () => { gfx.x = WIDTH + w; },
      });
    });
  }
}

