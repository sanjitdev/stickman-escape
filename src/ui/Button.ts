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
  private readonly label: Phaser.GameObjects.Text;
  private readonly fill: Phaser.GameObjects.Graphics;
  private readonly glowRing: Phaser.GameObjects.Graphics;
  private readonly shimmer: Phaser.GameObjects.Graphics;
  private readonly visuals: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ButtonConfig) {
    super(scene, x, y);
    scene.add.existing(this);

    const w = config.width ?? 200;
    const h = config.height ?? 50;
    const r = 10;

    // ── Inner visuals container (this is what gets scaled, not `this`) ────────
    this.visuals = scene.add.container(0, 0);
    this.add(this.visuals);

    // Glow ring
    this.glowRing = scene.make.graphics({}).setAlpha(0);
    for (let i = 3; i > 0; i--) {
      this.glowRing.lineStyle(i * 2, 0x5599ff, 0.12 * (4 - i));
      this.glowRing.strokeRoundedRect(-w / 2 - i * 2, -h / 2 - i * 2, w + i * 4, h + i * 4, r + i);
    }
    this.visuals.add(this.glowRing);

    // Fill
    this.fill = scene.make.graphics({});
    this.drawIdle(w, h, r);
    this.visuals.add(this.fill);

    // Shimmer
    this.shimmer = scene.make.graphics({}).setAlpha(0);
    this.shimmer.fillStyle(0xffffff, 0.10);
    this.shimmer.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h / 2 - 2, { tl: r - 1, tr: r - 1, bl: 0, br: 0 });
    this.visuals.add(this.shimmer);

    // Label
    this.label = scene.make.text({
      x: 0, y: 0,
      text: config.text,
      style: {
        fontSize: `${config.fontSize ?? 20}px`,
        color: '#e8f4ff',
        fontFamily: 'Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 1,
      },
    }).setOrigin(0.5);
    this.visuals.add(this.label);

    // Hidden image (API compat — not added to scene)
    // (no unused bg image)

    // ── Hit area lives on the OUTER container at fixed scale 1 ───────────────
    this.setSize(w, h);
    this.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );

    // ── Events ────────────────────────────────────────────────────────────────
    this.on('pointerover', () => {
      this.drawHover(w, h, r);
      scene.tweens.add({ targets: [this.glowRing, this.shimmer], alpha: 1, duration: 120, ease: 'Quad.easeOut' });
      scene.tweens.add({ targets: this.visuals, scaleX: 1.06, scaleY: 1.06, duration: 120, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: this.label, y: -1, duration: 120 });
    });

    this.on('pointerout', () => {
      this.drawIdle(w, h, r);
      scene.tweens.add({ targets: [this.glowRing, this.shimmer], alpha: 0, duration: 180 });
      scene.tweens.add({ targets: this.visuals, scaleX: 1, scaleY: 1, duration: 180, ease: 'Quad.easeOut' });
      scene.tweens.add({ targets: this.label, y: 0, duration: 180 });
    });

    this.on('pointerdown', () => {
      this.drawPressed(w, h, r);
      scene.tweens.add({ targets: this.visuals, scaleX: 0.96, scaleY: 0.96, duration: 80, ease: 'Quad.easeOut' });
      scene.tweens.add({ targets: this.label, y: 2, duration: 80 });
    });

    this.on('pointerup', () => {
      this.drawHover(w, h, r);
      scene.tweens.add({ targets: this.visuals, scaleX: 1.06, scaleY: 1.06, duration: 100, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: this.label, y: -1, duration: 100 });
      audioSystem.playSfx('sfx-click');
      config.onClick();
    });
  }

  private drawIdle(w: number, h: number, r: number): void {
    this.fill.clear();
    this.fill.fillGradientStyle(0x1a3050, 0x1a3050, 0x0d1e35, 0x0d1e35);
    this.fill.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    this.fill.lineStyle(1.5, 0x3a6090, 0.9);
    this.fill.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  }

  private drawHover(w: number, h: number, r: number): void {
    this.fill.clear();
    this.fill.fillGradientStyle(0x2a5080, 0x2a5080, 0x162840, 0x162840);
    this.fill.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    this.fill.lineStyle(2, 0x5599ee, 1.0);
    this.fill.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  }

  private drawPressed(w: number, h: number, r: number): void {
    this.fill.clear();
    this.fill.fillGradientStyle(0x0d1e35, 0x0d1e35, 0x1a3050, 0x1a3050);
    this.fill.fillRoundedRect(-w / 2, -h / 2, w, h, r);
    this.fill.lineStyle(2, 0x7ab8ff, 1.0);
    this.fill.strokeRoundedRect(-w / 2, -h / 2, w, h, r);
  }

  setText(text: string): void {
    this.label.setText(text);
  }
}
