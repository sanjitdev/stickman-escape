import Phaser from 'phaser';
import { GAME } from '@/core/Config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.createProgressBar();
    this.loadSprites();
    // Audio loading is intentionally deferred — files are only loaded if they
    // actually exist. Attempting to load missing audio causes unhandled
    // WebAudio promise rejections. Instead, AudioSystem checks the cache
    // before playing and silently skips missing keys.
    this.loadLevelData();
  }

  create(): void {
    this.createAnimations();
    this.scene.start('MainMenuScene');
  }

  private createProgressBar(): void {
    const { WIDTH, HEIGHT } = GAME;
    const bar = this.add.graphics();
    const bg = this.add.graphics();
    bg.fillStyle(0x222222).fillRect(WIDTH / 2 - 200, HEIGHT / 2 - 15, 400, 30);
    this.add.text(WIDTH / 2, HEIGHT / 2 - 40, 'Loading…', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.clear().fillStyle(0x4a6fa5).fillRect(WIDTH / 2 - 198, HEIGHT / 2 - 13, 396 * v, 26);
    });
  }

  private loadSprites(): void {
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      // Re-create a minimal placeholder so the key exists and animations don't crash.
      if (!this.textures.exists(file.key)) {
        const gfx = this.add.graphics().fillStyle(0x888888).fillRect(0, 0, 32, 32);
        gfx.generateTexture(file.key, 32, 32);
        gfx.destroy();
      }
    });

    // BootScene generates canvas-based placeholder textures so the game is
    // playable without real assets. Phaser's loader skips any key that already
    // exists in the TextureManager, so we must purge the placeholders first.
    [
      'player-idle', 'player-run', 'player-jump', 'player-fall',
      'player-doublejump', 'player-walljump', 'player-hit',
      'enemy', 'enemy-run', 'enemy-hit',
      'fruit-apple', 'trap-saw', 'trap-spike',
      'checkpoint', 'checkpoint-idle', 'checkpoint-out',
      'tiles', 'key', 'door-closed', 'door-open',
      'platform-moving', 'platform-falling', 'portal',
      'bg-forest', 'bg-cave', 'bg-fortress',
    ].forEach(k => this.textures.remove(k));

    const sheet = (key: string, path: string, w: number, h: number) =>
      this.load.spritesheet(key, `assets/sprites/${path}`, { frameWidth: w, frameHeight: h });

    // ── Player (Pixel Adventure 1 — Virtual Guy, 32×32) ─────────────────────
    // Each animation is its own horizontal strip; all @ 20 FPS.
    sheet('player-idle',      'player-idle.png',      32, 32); // 11 frames
    sheet('player-run',       'player-run.png',        32, 32); // 12 frames
    sheet('player-jump',      'player-jump.png',       32, 32); //  1 frame
    sheet('player-fall',      'player-fall.png',       32, 32); //  1 frame
    sheet('player-doublejump','player-doublejump.png', 32, 32); //  6 frames
    sheet('player-walljump',  'player-walljump.png',   32, 32); //  5 frames
    sheet('player-hit',       'player-hit.png',        32, 32); //  7 frames

    // ── Enemies ────────────────────────────────────────────────────────────
    // PA1 Mushroom files (optional — fall back to enemy.png if absent)
    sheet('enemy-run', 'enemy-run.png', 32, 32); // 14 frames (optional)
    sheet('enemy-hit', 'enemy-hit.png', 32, 32); //  8 frames (optional)
    // legacy / fallback 2-frame enemy sheet already present
    sheet('enemy', 'enemy.png', 32, 32); // 2 frames

    // ── Collectibles ─────────────────────────────────────────────────────────
    sheet('fruit-apple', 'fruit-apple.png', 32, 32); // 17 frames (used for coins)

    // ── Traps ────────────────────────────────────────────────────────────────
    sheet('trap-saw', 'trap-saw.png', 38, 38); // 8 frames
    this.load.image('trap-spike', 'assets/sprites/trap-spike.png');

    // ── Checkpoints (64×64) ──────────────────────────────────────────────────
    this.load.image('checkpoint', 'assets/sprites/checkpoint.png');
    sheet('checkpoint-idle', 'checkpoint-idle.png', 64, 64); // 10 frames
    sheet('checkpoint-out',  'checkpoint-out.png',  64, 64); // 10 frames

    // ── Static / misc ────────────────────────────────────────────────────────
    this.load.image('tiles',          'assets/sprites/tiles.png');
    this.load.image('key',            'assets/sprites/key.png');
    this.load.image('door-closed',    'assets/sprites/door-closed.png');
    this.load.image('door-open',      'assets/sprites/door-open.png');
    this.load.image('platform-moving','assets/sprites/platform-moving.png');
    this.load.image('platform-falling','assets/sprites/platform-falling.png');
    this.load.image('portal',         'assets/sprites/portal.png');
    this.load.image('bg-forest',      'assets/sprites/bg-forest.png');
    this.load.image('bg-cave',        'assets/sprites/bg-cave.png');
    this.load.image('bg-fortress',    'assets/sprites/bg-fortress.png');
  }

  // loadAudio is intentionally unused — audio loading deferred or removed
  // private loadAudio(): void {}

  private loadLevelData(): void {
    for (let i = 1; i <= 7; i++) {
      this.load.json(`level-config-${i}`, `assets/data/levels/level-${i}.json`);
    }
  }

  private createAnimations(): void {
    const PA1_FPS = 20;

    const anim = (
      key: string,
      textureKey: string,
      start: number,
      end: number,
      rate = PA1_FPS,
      repeat = -1,
    ) => {
      if (this.anims.exists(key)) return;
      const tex = this.textures.get(textureKey);
      const hasFrames = tex.has(String(start));
      this.anims.create({
        key,
        frames: hasFrames
          ? this.anims.generateFrameNumbers(textureKey, { start, end })
          : [{ key: textureKey, frame: '__BASE' }],
        frameRate: rate,
        repeat,
      });
    };

    // ── Player ───────────────────────────────────────────────────────────────
    anim('player-idle',       'player-idle',       0, 10);
    anim('player-run',        'player-run',         0, 11);
    anim('player-jump',       'player-jump',        0,  0, PA1_FPS, 0);
    anim('player-fall',       'player-fall',        0,  0);
    anim('player-doublejump', 'player-doublejump',  0,  5, PA1_FPS, 0);
    anim('player-walljump',   'player-walljump',    0,  4, PA1_FPS, 0);
    anim('player-wall-slide', 'player-walljump',    0,  0); // first frame only — slide hold
    anim('player-dash',       'player-doublejump',  0,  5, PA1_FPS * 2, 0); // faster doublejump reused
    anim('player-dead',       'player-hit',         0,  6, PA1_FPS, 0);

    // ── Enemy ────────────────────────────────────────────────────────────────
    // Use PA1 Mushroom if loaded, otherwise the 2-frame fallback sheet
    const hasEnemyRun = this.textures.get('enemy-run').frameTotal > 2;
    anim('enemy-walk', hasEnemyRun ? 'enemy-run' : 'enemy', 0, hasEnemyRun ? 13 : 1);
    anim('enemy-hit',  'enemy-hit', 0,  7, PA1_FPS, 0);

    // ── Collectibles / traps ─────────────────────────────────────────────────
    anim('fruit-spin',   'fruit-apple', 0, 16);
    anim('trap-saw-spin','trap-saw',    0,  7);

    // ── Checkpoint ───────────────────────────────────────────────────────────
    anim('checkpoint-idle', 'checkpoint-idle', 0, 9);
    // checkpoint-out strip is 1664×64 = 26 frames
    anim('checkpoint-out',  'checkpoint-out',  0, 25, PA1_FPS, 0);
  }
}
