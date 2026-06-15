import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';

export class IdleState extends PlayerState {
  enter(): void {
    this.player.setVelocityX(0);
    this.player.anims.play('player-idle', true);
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
    if (input.left || input.right) {
      player.switchTo('run');
    }
  }
}
