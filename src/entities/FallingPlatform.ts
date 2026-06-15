import Phaser from 'phaser';

const FALL_DELAY = 600; // ms after player lands before platform falls
const RESPAWN_DELAY = 3000;

export class FallingPlatform extends Phaser.Physics.Arcade.Image {
  private readonly spawnX: number;
  private readonly spawnY: number;
  private triggered = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'platform-falling');
    this.spawnX = x;
    this.spawnY = y;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0.5);
  }

  trigger(): void {
    if (this.triggered) return;
    this.triggered = true;
    // Shake then fall
    this.scene.tweens.add({
      targets: this,
      x: { value: [this.x - 3, this.x + 3, this.x] },
      duration: FALL_DELAY,
      onComplete: () => {
        (this.body as Phaser.Physics.Arcade.StaticBody).enable = false;
        this.scene.tweens.add({
          targets: this,
          y: this.y + 400,
          alpha: 0,
          duration: 600,
          onComplete: () => {
            this.scene.time.delayedCall(RESPAWN_DELAY, () => this.reset());
          },
        });
      },
    });
  }

  private reset(): void {
    this.triggered = false;
    this.setPosition(this.spawnX, this.spawnY);
    this.setAlpha(1);
    (this.body as Phaser.Physics.Arcade.StaticBody).reset(this.spawnX, this.spawnY);
    (this.body as Phaser.Physics.Arcade.StaticBody).enable = true;
  }
}
