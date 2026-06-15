import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { Button } from './Button';

interface ModalConfig {
  title: string;
  buttons: Array<{ text: string; onClick: () => void }>;
  width?: number;
  height?: number;
}

export class Modal extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, config: ModalConfig) {
    super(scene, GAME.WIDTH / 2, GAME.HEIGHT / 2);
    scene.add.existing(this);
    this.setDepth(100);

    const w = config.width ?? 400;
    const h = config.height ?? 300;

    // Backdrop
    const overlay = scene.add.rectangle(0, 0, GAME.WIDTH * 2, GAME.HEIGHT * 2, 0x000000, 0.6);
    this.add(overlay);

    // Panel
    const panel = scene.add.graphics();
    panel.fillStyle(0x1e2a3a);
    panel.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    panel.lineStyle(2, 0x4a6fa5);
    panel.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    this.add(panel);

    // Title
    const title = scene.add.text(0, -h / 2 + 40, config.title, {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);
    this.add(title);

    // Buttons
    const startY = -h / 2 + 120;
    config.buttons.forEach((btn, i) => {
      this.add(new Button(scene, 0, startY + i * 64, btn));
    });

    // Fix to camera
    this.setScrollFactor(0);
  }
}
