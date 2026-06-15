import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { Button } from '@/ui/Button';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(data: { level: number }): void {
    const { WIDTH, HEIGHT } = GAME;

    // Dim overlay
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55).setScrollFactor(0);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 100, 'PAUSED', {
      fontSize: '40px', color: '#ffffff', fontFamily: 'Arial, sans-serif',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0);

    new Button(this, WIDTH / 2, HEIGHT / 2, {
      text: 'RESUME',
      onClick: () => this.resume(),
    });

    new Button(this, WIDTH / 2, HEIGHT / 2 + 70, {
      text: 'SETTINGS',
      onClick: () => {
        this.scene.launch('SettingsScene');
        this.scene.sleep();
      },
    });

    new Button(this, WIDTH / 2, HEIGHT / 2 + 140, {
      text: 'QUIT',
      onClick: () => {
        this.scene.stop('LevelScene');
        this.scene.stop('PauseScene');
        this.scene.start('MainMenuScene');
      },
    });

    // Resume on ESC
    this.input.keyboard?.addKey('ESC').once('down', () => this.resume());

    void data;
  }

  private resume(): void {
    this.scene.resume('LevelScene');
    this.scene.stop();
  }
}
