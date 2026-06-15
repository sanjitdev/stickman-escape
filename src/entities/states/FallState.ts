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
    const body = player.arcadeBody;

    // Always apply fall gravity multiplier while descending
    body.setGravityY(PHYSICS.GRAVITY * (PHYSICS.FALL_GRAVITY_MULT - 1));

    if (player.onGround) {
      body.setGravityY(0);
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
      body.setGravityY(0);
      player.consumeJump();
      player.switchTo('jump');
      return;
    }

    // Double jump while falling (jumpCount 0 means we fell off a ledge)
    if (input.jumpPressed && player.jumpCount === 0) {
      body.setGravityY(0);
      player.consumeJump();
      player.setVelocityY(PHYSICS.DOUBLE_JUMP_VELOCITY);
      player.incrementJumpCount();
      player.incrementJumpCount(); // use both jumps
      player.emitEvent('double-jump');
    }

    if (input.dashPressed && player.canDash) {
      body.setGravityY(0);
      player.switchTo('dash');
      return;
    }

    if (player.wallDirection !== null) {
      body.setGravityY(0);
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

  exit(): void {
    this.player.arcadeBody.setGravityY(0);
  }
}
