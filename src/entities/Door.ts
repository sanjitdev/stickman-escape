import Phaser from 'phaser';

export class Door extends Phaser.Physics.Arcade.Image {
  readonly keyId: string;
  private isOpen = false;

  constructor(scene: Phaser.Scene, x: number, y: number, keyId: string) {
    super(scene, x, y, 'door-closed');
    this.keyId = keyId;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 1);
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.setTexture('door-open');
    this.scene.tweens.add({
      targets: this,
      scaleY: 0,
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        this.setAlpha(0);
      },
    });
    this.emit('door-opened', this.keyId);
  }

  get opened(): boolean {
    return this.isOpen;
  }
}
