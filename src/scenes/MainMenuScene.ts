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

    this.add.image(WIDTH / 2, HEIGHT / 2, 'bg-forest').setDisplaySize(WIDTH, HEIGHT);

    this.add.text(WIDTH / 2, HEIGHT / 3, 'STICKMAN ESCAPE', {
      fontSize: '52px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    new Button(this, WIDTH / 2, HEIGHT / 2 + 20, {
      text: 'PLAY',
      onClick: () => this.scene.start('LevelSelectScene'),
    });

    new Button(this, WIDTH / 2, HEIGHT / 2 + 90, {
      text: 'SETTINGS',
      onClick: () => this.scene.start('SettingsScene'),
    });

    const version = this.add.text(WIDTH - 8, HEIGHT - 8, 'v1.0', {
      fontSize: '12px', color: '#888888', fontFamily: 'Arial, sans-serif',
    }).setOrigin(1);

    this.cameras.main.fadeIn(400);

    // Subtle star particles
    this.add.particles(0, 0, 'coin', {
      x: { min: 0, max: WIDTH },
      y: { min: -10, max: -10 },
      speedY: { min: 40, max: 120 },
      lifespan: { min: 3000, max: 6000 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      frequency: 400,
      quantity: 1,
    });

    void version; // used in UI
  }
}
