import Phaser from 'phaser';
import { GAME } from '@/core/Config';

export class HUD extends Phaser.GameObjects.Container {
  private readonly coinText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly deathText: Phaser.GameObjects.Text;
  private readonly checkpointIndicator: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(50).setScrollFactor(0);

    const style = { fontSize: '18px', color: '#ffffff', fontFamily: 'Arial, sans-serif', stroke: '#000000', strokeThickness: 3 };

    this.coinText = scene.add.text(16, 16, '🪙 0', style);
    this.timerText = scene.add.text(GAME.WIDTH / 2, 16, '0:00', { ...style, fontSize: '20px' }).setOrigin(0.5, 0);
    this.deathText = scene.add.text(GAME.WIDTH - 16, 16, '💀 0', style).setOrigin(1, 0);
    this.checkpointIndicator = scene.add.text(GAME.WIDTH / 2, 48, '', { ...style, color: '#00ff88' }).setOrigin(0.5, 0).setAlpha(0);

    this.add([this.coinText, this.timerText, this.deathText, this.checkpointIndicator]);
  }

  update(elapsedMs: number, coins: number, totalCoins: number, deaths: number): void {
    const secs = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(secs / 60);
    const secsRemainder = secs % 60;
    this.timerText.setText(`${mins}:${String(secsRemainder).padStart(2, '0')}`);
    this.coinText.setText(`🪙 ${coins}/${totalCoins}`);
    this.deathText.setText(`💀 ${deaths}`);
  }

  showCheckpoint(): void {
    this.checkpointIndicator.setText('✓ CHECKPOINT').setAlpha(1);
    this.scene.tweens.add({
      targets: this.checkpointIndicator,
      alpha: 0,
      delay: 2000,
      duration: 500,
    });
  }
}
