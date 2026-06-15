import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class JumpState extends PlayerState {
  enter(): void {
    this.player.setVelocityY(PHYSICS.JUMP_VELOCITY);
    this.player.incrementJumpCount();
    this.player.anims.play('player-jump', true);
    this.player.emitEvent('jump');
  }

  update(dt: number, input: InputState): void {
    void dt;
    const { player } = this;
    const body = player.arcadeBody;

    // Variable jump height: cut velocity on early release
    if (!input.jumpHeld && body.velocity.y < PHYSICS.JUMP_VELOCITY * PHYSICS.VARIABLE_JUMP_MULTIPLIER) {
      player.setVelocityY(body.velocity.y * PHYSICS.VARIABLE_JUMP_MULTIPLIER);
    }

    // Double jump
    if (input.jumpPressed && player.jumpCount < 2) {
      player.consumeJump();
      player.setVelocityY(PHYSICS.DOUBLE_JUMP_VELOCITY);
      player.incrementJumpCount();
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

    if (body.velocity.y > 0) {
      player.switchTo('fall');
    }
  }
}
