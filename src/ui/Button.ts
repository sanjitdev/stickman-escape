import Phaser from 'phaser';
import { audioSystem } from '@/systems/AudioSystem';

interface ButtonConfig {
  text: string;
  onClick: () => void;
  fontSize?: number;
  width?: number;
  height?: number;
}

export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.Image;
  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ButtonConfig) {
    super(scene, x, y);
    scene.add.existing(this);

    const w = config.width ?? 200;
    const h = config.height ?? 50;

    this.bg = scene.add.image(0, 0, scene.textures.exists('btn-normal') ? 'btn-normal' : '__DEFAULT');
    this.bg.setDisplaySize(w, h);

    // Fallback if texture missing
    if (!scene.textures.exists('btn-normal')) {
      const gfx = scene.add.graphics();
      gfx.fillStyle(0x4a6fa5);
      gfx.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
      gfx.lineStyle(2, 0x7eb3e8);
      gfx.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      this.add(gfx);
    } else {
      this.add(this.bg);
    }

    this.label = scene.add.text(0, 0, config.text, {
      fontSize: `${config.fontSize ?? 20}px`,
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    this.add(this.label);
    this.setSize(w, h);
    // Hit area must be centered on the container's local origin
    this.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );

    this.on('pointerover', () => this.setScale(1.05));
    this.on('pointerout', () => this.setScale(1.0));
    this.on('pointerdown', () => this.setScale(0.97));
    this.on('pointerup', () => {
      this.setScale(1.05);
      audioSystem.playSfx('sfx-click');
      config.onClick();
    });
  }

  setText(text: string): void {
    this.label.setText(text);
  }
}
