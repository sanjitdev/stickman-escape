import Phaser from 'phaser';
import { PLAYER } from '@/core/Config';

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

    // Make a 4-frame player spritesheet: idle(blue), run1(teal), run2(cyan), jump(sky), fall(slate), dash(violet), dead(red), wall-slide(green)
    const playerGfx = this.add.graphics();
    const frames: [number, number][] = [
      [0x4488ff, 0], [0x44aaff, 1], [0x44ccff, 2],
      [0x88ddff, 3], [0x6699cc, 4], [0x9944ff, 5], [0xff4444, 6], [0x44ff88, 7],
    ];
    frames.forEach(([color], i) => {
      playerGfx.fillStyle(color);
      playerGfx.fillRect(i * PLAYER.SPRITE_WIDTH, 0, PLAYER.SPRITE_WIDTH, PLAYER.SPRITE_HEIGHT);
      // Head
      playerGfx.fillStyle(0xffddaa);
      playerGfx.fillCircle(i * PLAYER.SPRITE_WIDTH + 16, 10, 8);
    });
    playerGfx.generateTexture('player', PLAYER.SPRITE_WIDTH * 8, PLAYER.SPRITE_HEIGHT);
    playerGfx.destroy();
    // Register per-frame metadata so generateFrameNumbers works
    const playerTex = this.textures.get('player');
    for (let i = 0; i < 8; i++) {
      playerTex.add(i, 0, i * PLAYER.SPRITE_WIDTH, 0, PLAYER.SPRITE_WIDTH, PLAYER.SPRITE_HEIGHT);
    }

    // Enemy: 2-frame red
    const enemyGfx = this.add.graphics();
    [0xcc2222, 0xee4444].forEach((color, i) => {
      enemyGfx.fillStyle(color);
      enemyGfx.fillRect(i * 32, 0, 28, 32);
      enemyGfx.fillStyle(0xffddaa);
      enemyGfx.fillCircle(i * 32 + 14, 8, 7);
    });
    enemyGfx.generateTexture('enemy', 64, 32);
    enemyGfx.destroy();
    const enemyTex = this.textures.get('enemy');
    for (let i = 0; i < 2; i++) {
      enemyTex.add(i, 0, i * 32, 0, 32, 32);
    }

    // Tiles: 12 tiles wide, 3 rows. Row 0: ground (green), Row 1: platform (brown), Row 2: spike (red)
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
    make('checkpoint', 24, 48, 0x44aaff);
    make('bg-forest', 960, 544, 0x1a3a1a);
    make('bg-cave', 960, 544, 0x1a1a2e);
    make('bg-fortress', 960, 544, 0x2a1a1a);
  }
}
