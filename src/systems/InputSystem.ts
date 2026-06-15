import Phaser from 'phaser';
import { PHYSICS } from '@/core/Config';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  jumpBuffered: boolean;
  dashPressed: boolean;
  pause: boolean;
}

export class InputSystem {
  private readonly keys: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    up: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    shift: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    esc: Phaser.Input.Keyboard.Key;
  };

  private jumpBufferTimer = 0;
  private cachedState: InputState = this.emptyState();

  // Virtual touch flags (set by on-screen buttons)
  touchLeft = false;
  touchRight = false;
  touchJump = false;
  touchDash = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keys = {
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      space: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      shift: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      a: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      esc: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
  }

  update(dt: number): void {
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.keys.up) ||
      Phaser.Input.Keyboard.JustDown(this.keys.space) ||
      this.touchJump;
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.shift) || this.touchDash;
    const pause = Phaser.Input.Keyboard.JustDown(this.keys.esc);

    if (jumpPressed) {
      this.jumpBufferTimer = PHYSICS.JUMP_BUFFER_TIME;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    this.cachedState = {
      left: this.keys.left.isDown || this.keys.a.isDown || this.touchLeft,
      right: this.keys.right.isDown || this.keys.d.isDown || this.touchRight,
      jumpHeld: this.keys.up.isDown || this.keys.space.isDown || this.touchJump,
      jumpPressed,
      jumpBuffered: this.jumpBufferTimer > 0,
      dashPressed,
      pause,
    };
  }

  get state(): InputState {
    return this.cachedState;
  }

  clearJumpBuffer(): void {
    this.jumpBufferTimer = 0;
  }

  private emptyState(): InputState {
    return {
      left: false,
      right: false,
      jumpHeld: false,
      jumpPressed: false,
      jumpBuffered: false,
      dashPressed: false,
      pause: false,
    };
  }
}
