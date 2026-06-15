import Phaser from 'phaser';
import type { SfxKey } from '@/systems/AudioSystem';

export class Coin extends Phaser.Physics.Arcade.Image {
  static readonly SFX: SfxKey = 'sfx-coin';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'coin');
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.setOrigin(0.5, 0.5);
    // Idle float tween
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(): void {
    this.emit('collected');
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => this.destroy(),
    });
  }
}
