import type { Player } from '../Player';
import type { InputState } from '@/systems/InputSystem';

export abstract class PlayerState {
  constructor(protected readonly player: Player) {}
  abstract enter(): void;
  abstract update(dt: number, input: InputState): void;
  exit(): void {}
}
