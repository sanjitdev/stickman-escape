import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class WallSlideState extends PlayerState {
  enter(): void {
    this.player.resetJumpCount();
    this.player.arcadeBody.setGravityY(-PHYSICS.GRAVITY * 0.7); // slow the fall
    this.player.anims.play('player-wall-slide', true);
  }

  update(dt: number, input: InputState): void {
    void dt;
    const { player } = this;
    const wall = player.wallDirection;

    // Clamp downward velocity to wall slide speed
    if (player.arcadeBody.velocity.y > PHYSICS.WALL_SLIDE_VELOCITY) {
      player.setVelocityY(PHYSICS.WALL_SLIDE_VELOCITY);
    }

    // Wall jump
    if (input.jumpPressed) {
      player.consumeJump();
      player.switchTo('wallJump');
      return;
    }

    // Detach from wall
    const movingAwayFromWall =
      (wall === 'left' && input.right) || (wall === 'right' && input.left);
    if (movingAwayFromWall || wall === null) {
      player.switchTo('fall');
      return;
    }

    if (player.onGround) {
      player.switchTo('idle');
    }
  }

  exit(): void {
    this.player.arcadeBody.setGravityY(0);
  }
}
