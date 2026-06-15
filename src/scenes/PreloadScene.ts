import Phaser from 'phaser';
import { GAME, PLAYER } from '@/core/Config';

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
    // Only attempt to load real assets — failures leave BootScene placeholders intact.
    // Phaser will fire 'loaderror' and skip replacing the texture on failure.
    this.load.on('loaderror', (_file: Phaser.Loader.File) => {
      // Placeholder from BootScene stays; nothing to do.
    });
    const fw = PLAYER.SPRITE_WIDTH;
    const fh = PLAYER.SPRITE_HEIGHT;
    this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: fw, frameHeight: fh });
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('tiles', 'assets/sprites/tiles.png');
    this.load.image('coin', 'assets/sprites/coin.png');
    this.load.image('key', 'assets/sprites/key.png');
    this.load.image('door-closed', 'assets/sprites/door-closed.png');
    this.load.image('door-open', 'assets/sprites/door-open.png');
    this.load.image('platform-moving', 'assets/sprites/platform-moving.png');
    this.load.image('platform-falling', 'assets/sprites/platform-falling.png');
    this.load.image('portal', 'assets/sprites/portal.png');
    this.load.image('checkpoint', 'assets/sprites/checkpoint.png');
    this.load.image('bg-forest', 'assets/sprites/bg-forest.png');
    this.load.image('bg-cave', 'assets/sprites/bg-cave.png');
    this.load.image('bg-fortress', 'assets/sprites/bg-fortress.png');
  }

  private loadAudio(): void {
    // Audio files are optional — silently skip loading if missing.
    // The AudioSystem checks cache.audio.has() before playing, so
    // missing audio simply produces silence.
    const music = ['music-forest', 'music-cave', 'music-fortress'];
    const sfx = [
      'sfx-jump', 'sfx-double-jump', 'sfx-land', 'sfx-dash',
      'sfx-coin', 'sfx-key', 'sfx-death', 'sfx-checkpoint',
      'sfx-door', 'sfx-stomp', 'sfx-portal', 'sfx-click',
    ];
    const checkExists = async (url: string) => {
      try {
        const r = await fetch(url, { method: 'HEAD' });
        return r.ok;
      } catch { return false; }
    };
    void checkExists; // async check not needed — just load and let loaderror suppress
    music.forEach((k) => this.load.audio(k, [`assets/audio/${k}.ogg`, `assets/audio/${k}.mp3`]));
    sfx.forEach((k) => this.load.audio(k, [`assets/audio/${k}.ogg`, `assets/audio/${k}.mp3`]));
  }

  private loadLevelData(): void {
    for (let i = 1; i <= 7; i++) {
      this.load.json(`level-config-${i}`, `assets/data/levels/level-${i}.json`);
    }
  }

  private createAnimations(): void {
    // Frames: 0=idle, 1-2=run, 3=jump, 4=fall, 5=dash, 6=dead, 7=wall-slide
    const playerTex = this.textures.get('player');
    const hasPlayerFrames = playerTex.has(0);

    const anim = (key: string, frames: number[], rate: number, repeat = -1) => {
      if (this.anims.exists(key)) return;
      const frameData = hasPlayerFrames
        ? this.anims.generateFrameNumbers('player', { frames })
        : frames.map(() => ({ key: 'player', frame: '__BASE' }));
      this.anims.create({ key, frames: frameData, frameRate: rate, repeat });
    };

    anim('player-idle', [0], 1);
    anim('player-run', [1, 2], 10);
    anim('player-jump', [3], 1, 0);
    anim('player-fall', [4], 1);
    anim('player-dash', [5], 1, 0);
    anim('player-dead', [6], 1, 0);
    anim('player-wall-slide', [7], 1);

    if (!this.anims.exists('enemy-walk')) {
      const enemyTex = this.textures.get('enemy');
      const hasEnemyFrames = enemyTex.has(0);
      const enemyFrames = hasEnemyFrames
        ? this.anims.generateFrameNumbers('enemy', { frames: [0, 1] })
        : [{ key: 'enemy', frame: '__BASE' }];
      this.anims.create({ key: 'enemy-walk', frames: enemyFrames, frameRate: 6,
        repeat: -1,
      });
    }
  }
}
