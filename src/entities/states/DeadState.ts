import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';

export class DeadState extends PlayerState {
  enter(): void {
    this.player.setVelocity(0, -200);
    this.player.arcadeBody.setGravityY(0);
    this.player.anims.play('player-dead', true);
    this.player.setInvincible(true);
    this.player.emitEvent('died');
  }

  update(_dt: number, _input: InputState): void {
    // Dead — scene handles respawn externally
  }

  exit(): void {
    this.player.arcadeBody.setGravityY(0);
    this.player.setInvincible(false);
  }
}
