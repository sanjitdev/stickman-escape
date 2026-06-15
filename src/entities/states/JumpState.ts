import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class JumpState extends PlayerState {
  enter(): void {
    this.player.setVelocityY(PHYSICS.JUMP_VELOCITY);
    this.player.arcadeBody.setGravityY(0);
    this.player.incrementJumpCount();
    this.player.anims.play('player-jump', true);
    this.player.emitEvent('jump');
  }

  update(dt: number, input: InputState): void {
    void dt;
    const { player } = this;
    const body = player.arcadeBody;

    // Apply extra gravity per frame for snappy feel
    if (body.velocity.y > 0) {
      // Falling — accelerate downward faster
      body.setGravityY(PHYSICS.GRAVITY * (PHYSICS.FALL_GRAVITY_MULT - 1));
    } else if (!input.jumpHeld) {
      // Rising but button released — cut apex quickly
      body.setGravityY(PHYSICS.GRAVITY * (PHYSICS.LOW_JUMP_GRAVITY_MULT - 1));
    } else {
      body.setGravityY(0);
    }

    // Double jump
    if (input.jumpPressed && player.jumpCount < 2) {
      player.consumeJump();
      player.setVelocityY(PHYSICS.DOUBLE_JUMP_VELOCITY);
      player.incrementJumpCount();
      body.setGravityY(0);
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

    if (body.velocity.y > 0) {
      player.switchTo('fall');
    }
  }

  exit(): void {
    this.player.arcadeBody.setGravityY(0);
  }
}
