import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { Button } from '@/ui/Button';
import type { LevelStats } from '@/systems/SaveSystem';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(data: { level: number; stats: LevelStats }): void {
    const { WIDTH, HEIGHT } = GAME;
    const { level, stats } = data;

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0d2a0d);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 160, 'LEVEL COMPLETE!', {
      fontSize: '42px', color: '#44ff88', fontFamily: 'Arial, sans-serif',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // Stars
    const starStr = '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
    this.add.text(WIDTH / 2, HEIGHT / 2 - 90, starStr, {
      fontSize: '52px', color: '#ffcc00', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Stats
    const secs = Math.floor(stats.bestTime / 1000);
    const mins = Math.floor(secs / 60);
    const secsRemainder = secs % 60;
    const timeStr = `${mins}:${String(secsRemainder).padStart(2, '0')}`;
    const statsText = [
      `Time: ${timeStr}`,
      `Coins: ${stats.coinsCollected}/${stats.totalCoins}`,
      `Deaths: ${stats.deaths}`,
    ].join('\n');

    this.add.text(WIDTH / 2, HEIGHT / 2 - 10, statsText, {
      fontSize: '22px', color: '#ffffff', fontFamily: 'Arial, sans-serif',
      align: 'center',
    }).setOrigin(0.5);

    // Buttons
    const hasNext = level < GAME.TOTAL_LEVELS;
    if (hasNext) {
      new Button(this, WIDTH / 2, HEIGHT / 2 + 90, {
        text: 'NEXT LEVEL',
        onClick: () => {
          this.cameras.main.fadeOut(300, 0, 0, 0, () =>
            this.scene.start('LevelScene', { level: level + 1 }),
          );
        },
      });
    }

    new Button(this, WIDTH / 2, HEIGHT / 2 + (hasNext ? 160 : 90), {
      text: 'LEVEL SELECT',
      onClick: () => this.scene.start('LevelSelectScene'),
    });

    // Particle celebration
    this.add.particles(WIDTH / 2, HEIGHT / 2, 'coin', {
      speed: { min: 100, max: 300 },
      angle: { min: -130, max: -50 },
      scale: { start: 0.5, end: 0 },
      lifespan: 1200,
      quantity: 3,
      frequency: 80,
    });

    this.cameras.main.fadeIn(500);
  }
}
