import Phaser from 'phaser';

export class CameraSystem {
  private readonly cam: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, worldWidth: number, worldHeight: number) {
    this.cam = scene.cameras.main;
    this.cam.setBounds(0, 0, worldWidth, worldHeight);
  }

  follow(target: Phaser.GameObjects.GameObject): void {
    this.cam.startFollow(target, true, 0.1, 0.1);
  }

  shake(intensity = 0.005, duration = 200): void {
    this.cam.shake(duration, intensity);
  }

  flash(duration = 300, color = 0xffffff): void {
    this.cam.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
  }

  fadeIn(duration = 400): void {
    this.cam.fadeIn(duration);
  }

  fadeOut(duration = 400, callback?: () => void): void {
    this.cam.fadeOut(duration);
    if (callback) {
      this.cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, callback);
    }
  }
}
