import Phaser from 'phaser';
import { PHYSICS, PLAYER } from '@/core/Config';
import type { InputState } from '@/systems/InputSystem';
import { PlayerState } from './states/PlayerState';
import { IdleState } from './states/IdleState';
import { RunState } from './states/RunState';
import { JumpState } from './states/JumpState';
import { FallState } from './states/FallState';
import { WallSlideState } from './states/WallSlideState';
import { WallJumpState } from './states/WallJumpState';
import { DashState } from './states/DashState';
import { DeadState } from './states/DeadState';

type StateKey = 'idle' | 'run' | 'jump' | 'fall' | 'wallSlide' | 'wallJump' | 'dash' | 'dead';

const STATE_FACTORIES: Record<StateKey, (p: Player) => PlayerState> = {
  idle: (p) => new IdleState(p),
  run: (p) => new RunState(p),
  jump: (p) => new JumpState(p),
  fall: (p) => new FallState(p),
  wallSlide: (p) => new WallSlideState(p),
  wallJump: (p) => new WallJumpState(p),
  dash: (p) => new DashState(p),
  dead: (p) => new DeadState(p),
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private fsm!: PlayerState;

  // Timers (ms)
  private coyoteTimer = 0;
  private dashCooldownTimer = 0;
  private invincibleTimer = 0;

  jumpCount = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-idle', 0);
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    this.setOrigin(0.5, 1);
    this.arcadeBody.setSize(PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT);
    this.arcadeBody.setOffset(
      (PLAYER.SPRITE_WIDTH - PLAYER.BODY_WIDTH) / 2,
      PLAYER.SPRITE_HEIGHT - PLAYER.BODY_HEIGHT,
    );
    this.arcadeBody.setCollideWorldBounds(true);
    this.switchTo('idle');
  }

  update(dt: number, input: InputState): void {
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
    this.fsm.update(dt, input);
  }

  switchTo(key: StateKey): void {
    this.fsm?.exit();
    this.fsm = STATE_FACTORIES[key](this);
    this.fsm.enter();
  }

  die(): void {
    if (this.invincibleTimer > 0) return;
    this.switchTo('dead');
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.jumpCount = 0;
    this.coyoteTimer = 0;
    this.dashCooldownTimer = 0;
    this.switchTo('idle');
  }

  // ─── State helpers ───────────────────────────────────────────────────────────

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  get onGround(): boolean {
    return this.arcadeBody.blocked.down;
  }

  get wallDirection(): 'left' | 'right' | null {
    if (this.arcadeBody.blocked.left) return 'left';
    if (this.arcadeBody.blocked.right) return 'right';
    return null;
  }

  get canDash(): boolean {
    return this.dashCooldownTimer <= 0;
  }

  get coyoteActive(): boolean {
    return this.coyoteTimer > 0;
  }

  consumeJump(): void {
    this.coyoteTimer = 0;
    // jump buffer is cleared by InputSystem on next frame naturally
  }

  startCoyoteTimer(): void {
    this.coyoteTimer = PHYSICS.COYOTE_TIME;
  }

  startDashCooldown(): void {
    this.dashCooldownTimer = PHYSICS.DASH_COOLDOWN;
  }

  resetJumpCount(): void {
    this.jumpCount = 0;
  }

  incrementJumpCount(): void {
    this.jumpCount++;
  }

  setInvincible(on: boolean): void {
    this.invincibleTimer = on ? 9999 : 0;
    this.setAlpha(on ? 0.6 : 1);
  }

  get isInvincible(): boolean {
    return this.invincibleTimer > 0;
  }

  emitEvent(event: 'jump' | 'double-jump' | 'land' | 'dash' | 'died'): void {
    this.emit(event);
  }
}
