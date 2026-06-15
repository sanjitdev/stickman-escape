import Phaser from 'phaser';

export interface PlatformPath {
  x: number;
  y: number;
}

export class MovingPlatform extends Phaser.Physics.Arcade.Image {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    path: PlatformPath[],
    speed: number,
  ) {
    super(scene, x, y, 'platform-moving');
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0.5, 0.5);

    const points = path.map((p) => new Phaser.Math.Vector2(p.x, p.y));
    const totalDist = points.reduce((sum, pt, i) => {
      if (i === 0) return sum;
      return sum + Phaser.Math.Distance.BetweenPoints(points[i - 1], pt);
    }, 0);
    const duration = (totalDist / speed) * 1000;

    scene.tweens.add({
      targets: this,
      x: { value: path.map((p) => p.x) },
      y: { value: path.map((p) => p.y) },
      duration,
      repeat: -1,
      yoyo: true,
      ease: 'Linear',
      onUpdate: () => {
        (this.body as Phaser.Physics.Arcade.StaticBody).reset(this.x, this.y);
      },
    });
  }
}
