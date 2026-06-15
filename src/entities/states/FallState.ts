import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class FallState extends PlayerState {
  private coyoteUsed = false;

  enter(): void {
    this.coyoteUsed = false;
    this.player.startCoyoteTimer();
    this.player.anims.play('player-fall', true);
  }

  update(dt: number, input: InputState): void {
    void dt;
    const { player } = this;

    if (player.onGround) {
      player.resetJumpCount();
      player.emitEvent('land');
      if (input.jumpBuffered) {
        player.consumeJump();
        player.switchTo('jump');
      } else if (input.left || input.right) {
        player.switchTo('run');
      } else {
        player.switchTo('idle');
      }
      return;
    }

    // Coyote jump
    if (input.jumpPressed && !this.coyoteUsed && player.coyoteActive) {
      this.coyoteUsed = true;
      player.consumeJump();
      player.switchTo('jump');
      return;
    }

    // Double jump while falling (jumpCount 0 means we fell off a ledge)
    if (input.jumpPressed && player.jumpCount === 0) {
      player.consumeJump();
      player.setVelocityY(PHYSICS.DOUBLE_JUMP_VELOCITY);
      player.incrementJumpCount();
      player.incrementJumpCount(); // use both jumps
      player.emitEvent('double-jump');
    }

    if (input.dashPressed && player.canDash) {
      player.switchTo('dash');
      return;
    }

    if (player.wallDirection !== null) {
      player.switchTo('wallSlide');
      return;
    }

    // Horizontal control in air
    if (input.left) {
      player.setFlipX(true);
      player.setVelocityX(-PHYSICS.RUN_SPEED);
    } else if (input.right) {
      player.setFlipX(false);
      player.setVelocityX(PHYSICS.RUN_SPEED);
    }
  }
}
