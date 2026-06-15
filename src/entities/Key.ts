import Phaser from 'phaser';

export class Key extends Phaser.Physics.Arcade.Image {
  readonly keyId: string;

  constructor(scene: Phaser.Scene, x: number, y: number, keyId: string) {
    super(scene, x, y, 'key');
    this.keyId = keyId;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0.5);
    scene.tweens.add({
      targets: this,
      angle: 15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(): void {
    this.emit('key-collected', this.keyId);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy(),
    });
  }
}
