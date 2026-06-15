import Phaser from 'phaser';
import type { SfxKey } from '@/systems/AudioSystem';

export class Coin extends Phaser.Physics.Arcade.Sprite {
  static readonly SFX: SfxKey = 'sfx-coin';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'fruit-apple', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0.5);
    this.anims.play('fruit-spin', true);
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
    this.anims.stop();
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
