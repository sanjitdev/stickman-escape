import Phaser from 'phaser';

type EnemyFSM = 'walk' | 'turn' | 'stunned';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private fsm: EnemyFSM = 'walk';
  private readonly patrolStart: number;
  private readonly patrolEnd: number;
  private direction = 1; // 1=right, -1=left
  private turnTimer = 0;

  private static readonly SPEED = 80;
  private static readonly TURN_DURATION = 300;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolStart: number, patrolEnd: number) {
    super(scene, x, y, 'enemy');
    this.patrolStart = patrolStart;
    this.patrolEnd = patrolEnd;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.anims.play('enemy-walk', true);
  }

  update(dt: number): void {
    if (this.fsm === 'stunned') return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.fsm === 'turn') {
      this.turnTimer -= dt;
      if (this.turnTimer <= 0) {
        this.direction *= -1;
        this.setFlipX(this.direction < 0);
        this.fsm = 'walk';
      }
      return;
    }

    // Walk
    body.setVelocityX(Enemy.SPEED * this.direction);

    const atEdge =
      (this.direction > 0 && this.x >= this.patrolEnd) ||
      (this.direction < 0 && this.x <= this.patrolStart);
    const hitWall = body.blocked.left || body.blocked.right;

    if (atEdge || hitWall) {
      body.setVelocityX(0);
      this.fsm = 'turn';
      this.turnTimer = Enemy.TURN_DURATION;
    }
  }

  stomp(): void {
    this.fsm = 'stunned';
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0,
      duration: 250,
      onComplete: () => this.destroy(),
    });
    this.emit('stomped');
  }
}
