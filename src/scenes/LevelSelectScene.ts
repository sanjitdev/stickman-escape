import Phaser from 'phaser';
import { GAME, GAME as G } from '@/core/Config';
import { Button } from '@/ui/Button';
import { saveSystem } from '@/systems/SaveSystem';

const LEVEL_WORLDS = [
  { name: 'Forest', levels: [1, 2], color: 0x336633 },
  { name: 'Cave', levels: [3, 4], color: 0x333366 },
  { name: 'Fortress', levels: [5, 6, 7], color: 0x663333 },
];

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME;
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0d1b2a);

    this.add.text(WIDTH / 2, 40, 'SELECT LEVEL', {
      fontSize: '32px', color: '#ffffff', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    let yOffset = 120;
    LEVEL_WORLDS.forEach((world) => {
      this.add.text(WIDTH / 2, yOffset, world.name, {
        fontSize: '20px', color: '#aaccff', fontFamily: 'Arial, sans-serif',
      }).setOrigin(0.5);
      yOffset += 36;

      const rowX = WIDTH / 2 - ((world.levels.length - 1) * 110) / 2;
      world.levels.forEach((level, i) => {
        const unlocked = saveSystem.isUnlocked(level);
        const stats = saveSystem.getLevelStats(level);
        const bx = rowX + i * 110;

        const bg = this.add.rectangle(bx, yOffset, 90, 70, unlocked ? world.color : 0x333333)
          .setStrokeStyle(2, unlocked ? 0xffffff : 0x555555);

        this.add.text(bx, yOffset - 10, String(level), {
          fontSize: '24px', color: unlocked ? '#ffffff' : '#555555',
          fontFamily: 'Arial, sans-serif',
        }).setOrigin(0.5);

        if (stats) {
          const stars = '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
          this.add.text(bx, yOffset + 16, stars, {
            fontSize: '14px', color: '#ffcc00', fontFamily: 'Arial, sans-serif',
          }).setOrigin(0.5);
        } else if (!unlocked) {
          this.add.text(bx, yOffset, '🔒', {
            fontSize: '22px', fontFamily: 'Arial, sans-serif',
          }).setOrigin(0.5);
        }

        if (unlocked) {
          bg.setInteractive({ useHandCursor: true });
          bg.on('pointerover', () => { bg.fillColor = world.color + 0x111111; });
          bg.on('pointerout', () => { bg.fillColor = world.color; });
          bg.on('pointerup', () => {
            this.cameras.main.fadeOut(300);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('LevelScene', { level });
            });
          });
        }
      });

      yOffset += 110;
    });

    new Button(this, 80, G.HEIGHT - 40, {
      text: '← BACK',
      width: 120,
      height: 40,
      fontSize: 16,
      onClick: () => this.scene.start('MainMenuScene'),
    });

    this.cameras.main.fadeIn(400);
  }
}
