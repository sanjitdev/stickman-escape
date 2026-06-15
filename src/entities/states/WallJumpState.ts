import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class WallJumpState extends PlayerState {
  private timer = 0;
  private readonly CONTROL_RESTORE_TIME = 200; // ms before full air control returns

  enter(): void {
    this.timer = this.CONTROL_RESTORE_TIME;
    const wall = this.player.wallDirection ?? 'left';
    const xDir = wall === 'left' ? 1 : -1;
    this.player.setFlipX(wall === 'right');
    this.player.setVelocity(PHYSICS.WALL_JUMP.x * xDir, PHYSICS.WALL_JUMP.y);
    this.player.incrementJumpCount();
    this.player.emitEvent('jump');
    this.player.anims.play('player-jump', true);
  }

  update(dt: number, input: InputState): void {
    void input;
    this.timer -= dt;

    if (this.player.onGround) {
      this.player.resetJumpCount();
      this.player.switchTo('idle');
      return;
    }

    if (this.player.arcadeBody.velocity.y > 0) {
      this.player.switchTo('fall');
    }
  }
}
