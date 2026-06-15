import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { Button } from '@/ui/Button';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data: { level: number }): void {
    const { WIDTH, HEIGHT } = GAME;

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x200000);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 100, 'YOU DIED', {
      fontSize: '52px',
      color: '#ff4444',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    new Button(this, WIDTH / 2, HEIGHT / 2 + 20, {
      text: 'RETRY',
      onClick: () => {
        this.cameras.main.fadeOut(300, 0, 0, 0, () =>
          this.scene.start('LevelScene', { level: data.level }),
        );
      },
    });

    new Button(this, WIDTH / 2, HEIGHT / 2 + 90, {
      text: 'LEVEL SELECT',
      onClick: () => this.scene.start('LevelSelectScene'),
    });

    new Button(this, WIDTH / 2, HEIGHT / 2 + 160, {
      text: 'MAIN MENU',
      onClick: () => this.scene.start('MainMenuScene'),
    });

    this.cameras.main.fadeIn(400);
  }
}
