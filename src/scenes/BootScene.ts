import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start('PreloadScene');
  }

  private generatePlaceholderTextures(): void {
    const make = (key: string, w: number, h: number, color: number, shape: 'rect' | 'circle' = 'rect') => {
      if (this.textures.exists(key)) return;
      const gfx = this.add.graphics();
      gfx.fillStyle(color);
      if (shape === 'circle') gfx.fillCircle(w / 2, h / 2, w / 2);
      else gfx.fillRect(0, 0, w, h);
      gfx.generateTexture(key, w, h);
      gfx.destroy();
    };

    // PA1-style: each player animation is its own spritesheet key
    const makeSheet = (key: string, frameCount: number, color: number, w = 32, h = 32) => {
      if (this.textures.exists(key)) return;
      const gfx = this.add.graphics();
      for (let i = 0; i < frameCount; i++) {
        gfx.fillStyle(color);
        gfx.fillRect(i * w, 0, w - 2, h);
        gfx.fillStyle(0xffddaa);
        gfx.fillCircle(i * w + w / 2, h / 4, w / 5);
      }
      gfx.generateTexture(key, w * frameCount, h);
      gfx.destroy();
      const tex = this.textures.get(key);
      for (let i = 0; i < frameCount; i++) {
        tex.add(i, 0, i * w, 0, w, h);
      }
    };

    // Player animation strips (Pixel Adventure 1 — Virtual Guy, 32×32 per frame)
    makeSheet('player-idle',       11, 0x4488ff);
    makeSheet('player-run',        12, 0x44aaff);
    makeSheet('player-jump',        1, 0x88ddff);
    makeSheet('player-fall',        1, 0x6699cc);
    makeSheet('player-doublejump',  6, 0xaaddff);
    makeSheet('player-walljump',    5, 0x66bbff);
    makeSheet('player-hit',         7, 0xff4444);

    // Enemy animation strips (Pixel Adventure 1 — Mushroom, 32×32)
    makeSheet('enemy',     2,  0xcc2222); // 2-frame fallback (enemy.png)
    makeSheet('enemy-run', 14, 0xcc2222); // PA1 Mushroom run (optional)
    makeSheet('enemy-hit',  8, 0xff6666); // PA1 Mushroom hit (optional)

    // Fruit collectible (Pixel Adventure 1 — Apple, 32×32)
    makeSheet('fruit-apple', 17, 0xff8800, 32, 32);

    // Saw trap (Pixel Adventure 1 — 38×38)
    makeSheet('trap-saw', 8, 0xaaaaaa, 38, 38);

    // Tiles: 12 tiles wide, 3 rows
    const tileGfx = this.add.graphics();
    for (let col = 0; col < 12; col++) {
      tileGfx.fillStyle(0x558833);
      tileGfx.fillRect(col * 16, 0, 15, 15);
      tileGfx.fillStyle(0x886644);
      tileGfx.fillRect(col * 16, 16, 15, 15);
      tileGfx.fillStyle(0xcc2222);
      tileGfx.fillRect(col * 16 + 4, 26, 7, 7);
    }
    tileGfx.generateTexture('tiles', 192, 48);
    tileGfx.destroy();

    make('coin', 14, 14, 0xffdd00, 'circle');
    make('key', 24, 12, 0xffaa00);
    make('door-closed', 32, 48, 0x664422);
    make('door-open', 32, 48, 0x88aa44);
    make('platform-moving', 80, 16, 0x996644);
    make('platform-falling', 80, 16, 0xaa8855);
    make('portal', 32, 48, 0x44ffcc);
    make('checkpoint', 64, 64, 0x44aaff);
    make('bg-forest', 960, 544, 0x1a3a1a);
    make('bg-cave', 960, 544, 0x1a1a2e);
    make('bg-fortress', 960, 544, 0x2a1a1a);
    make('trap-spike', 16, 14, 0xaaaaaa);
  }
}
