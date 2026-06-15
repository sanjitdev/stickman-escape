import { PlayerState } from './PlayerState';
import type { InputState } from '@/systems/InputSystem';
import { PHYSICS } from '@/core/Config';

export class DashState extends PlayerState {
  private timer = 0;

  enter(): void {
    this.timer = PHYSICS.DASH_DURATION;
    this.player.startDashCooldown();
    const dir = this.player.flipX ? -1 : 1;
    this.player.setVelocity(PHYSICS.DASH_SPEED * dir, 0);
    this.player.arcadeBody.setGravityY(-PHYSICS.GRAVITY); // cancel gravity
    this.player.setInvincible(true);
    this.player.anims.play('player-dash', true);
    this.player.emitEvent('dash');
  }

  update(dt: number, input: InputState): void {
    void input;
    this.timer -= dt;
    if (this.timer <= 0) {
      if (this.player.onGround) {
        this.player.switchTo('idle');
      } else {
        this.player.switchTo('fall');
      }
    }
  }

  exit(): void {
    this.player.arcadeBody.setGravityY(0);
    this.player.setInvincible(false);
  }
}
