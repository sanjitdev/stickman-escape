import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class RunState extends PlayerState {
  enter(): void {
    this.player.anims.play('player-run', true);
  }

  update(dt: number, input: InputState): void {
    void dt;
    const { player } = this;

    if (!player.onGround) {
      player.switchTo('fall');
      return;
    }
    if (input.jumpBuffered) {
      player.consumeJump();
      player.switchTo('jump');
      return;
    }
    if (input.dashPressed && player.canDash) {
      player.switchTo('dash');
      return;
    }

    if (input.left) {
      player.setFlipX(true);
      player.setVelocityX(-PHYSICS.RUN_SPEED);
    } else if (input.right) {
      player.setFlipX(false);
      player.setVelocityX(PHYSICS.RUN_SPEED);
    } else {
      player.switchTo('idle');
    }
  }
}
