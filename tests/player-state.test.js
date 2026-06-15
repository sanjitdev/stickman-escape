import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PHYSICS } from '@/core/Config';
// ─── Mock Player ─────────────────────────────────────────────────────────────
function makePlayer(overrides = {}) {
    const mock = {
        onGround: true,
        wallDirection: null,
        canDash: true,
        coyoteActive: false,
        jumpCount: 0,
        isInvincible: false,
        flipX: false,
        arcadeBody: {
            velocity: { x: 0, y: 0 },
            blocked: { down: true, left: false, right: false, up: false },
            setGravityY: vi.fn(),
        },
        anims: { play: vi.fn() },
        switchTo: vi.fn(),
        setVelocityX: vi.fn(),
        setVelocityY: vi.fn(),
        setVelocity: vi.fn(),
        setFlipX: vi.fn(),
        setAlpha: vi.fn(),
        consumeJump: vi.fn(),
        startCoyoteTimer: vi.fn(),
        startDashCooldown: vi.fn(),
        resetJumpCount: vi.fn(),
        incrementJumpCount: vi.fn(),
        setInvincible: vi.fn(),
        emitEvent: vi.fn(),
        emit: vi.fn(),
        ...overrides,
    };
    return mock;
}
function input(overrides = {}) {
    return {
        left: false, right: false, jumpHeld: false,
        jumpPressed: false, jumpBuffered: false,
        dashPressed: false, pause: false,
        ...overrides,
    };
}
// ─── Import states after mocking (no Phaser runtime needed) ──────────────────
// States only import Config and types, so no Phaser dependency at test time.
import { IdleState } from '@/entities/states/IdleState';
import { RunState } from '@/entities/states/RunState';
import { JumpState } from '@/entities/states/JumpState';
import { FallState } from '@/entities/states/FallState';
import { DashState } from '@/entities/states/DashState';
import { WallSlideState } from '@/entities/states/WallSlideState';
describe('IdleState', () => {
    let player;
    beforeEach(() => { player = makePlayer(); });
    it('zeroes velocity on enter', () => {
        new IdleState(player).enter();
        expect(player.setVelocityX).toHaveBeenCalledWith(0);
    });
    it('transitions to run when direction pressed', () => {
        const state = new IdleState(player);
        state.enter();
        state.update(16, input({ right: true }));
        expect(player.switchTo).toHaveBeenCalledWith('run');
    });
    it('transitions to jump on buffered jump', () => {
        const state = new IdleState(player);
        state.enter();
        state.update(16, input({ jumpBuffered: true }));
        expect(player.switchTo).toHaveBeenCalledWith('jump');
        expect(player.consumeJump).toHaveBeenCalled();
    });
    it('transitions to fall when not on ground', () => {
        const p = makePlayer({ onGround: false });
        const state = new IdleState(p);
        state.enter();
        state.update(16, input());
        expect(p.switchTo).toHaveBeenCalledWith('fall');
    });
    it('transitions to dash when dash pressed and cooldown ready', () => {
        const state = new IdleState(player);
        state.enter();
        state.update(16, input({ dashPressed: true }));
        expect(player.switchTo).toHaveBeenCalledWith('dash');
    });
});
describe('RunState', () => {
    let player;
    beforeEach(() => { player = makePlayer(); });
    it('applies run speed to the right', () => {
        const state = new RunState(player);
        state.enter();
        state.update(16, input({ right: true }));
        expect(player.setVelocityX).toHaveBeenCalledWith(PHYSICS.RUN_SPEED);
    });
    it('transitions to idle when no direction', () => {
        const state = new RunState(player);
        state.enter();
        state.update(16, input());
        expect(player.switchTo).toHaveBeenCalledWith('idle');
    });
});
describe('JumpState', () => {
    it('sets jump velocity on enter', () => {
        const body = { velocity: { x: 0, y: 0 }, setGravityY: vi.fn(), blocked: {} };
        const player = makePlayer({ arcadeBody: body });
        new JumpState(player).enter();
        expect(player.setVelocityY).toHaveBeenCalledWith(PHYSICS.JUMP_VELOCITY);
        expect(player.incrementJumpCount).toHaveBeenCalled();
    });
    it('transitions to fall when velocity turns positive', () => {
        const body = { velocity: { x: 0, y: 10 }, setGravityY: vi.fn(), blocked: {} };
        const player = makePlayer({ arcadeBody: body, onGround: false, wallDirection: null });
        const state = new JumpState(player);
        state.update(16, input({ jumpHeld: true }));
        expect(player.switchTo).toHaveBeenCalledWith('fall');
    });
});
describe('FallState coyote jump', () => {
    it('triggers jump during coyote window', () => {
        const player = makePlayer({ onGround: false, coyoteActive: true, jumpCount: 0 });
        const state = new FallState(player);
        state.enter();
        state.update(16, input({ jumpPressed: true }));
        expect(player.switchTo).toHaveBeenCalledWith('jump');
        expect(player.consumeJump).toHaveBeenCalled();
    });
    it('does not coyote jump twice', () => {
        const player = makePlayer({ onGround: false, coyoteActive: true, jumpCount: 0 });
        const state = new FallState(player);
        state.enter();
        state.update(16, input({ jumpPressed: true })); // first jump
        vi.clearAllMocks();
        state.update(16, input({ jumpPressed: true })); // second frame
        expect(player.switchTo).not.toHaveBeenCalledWith('jump');
    });
});
describe('DashState', () => {
    it('starts cooldown on enter', () => {
        const player = makePlayer();
        new DashState(player).enter();
        expect(player.startDashCooldown).toHaveBeenCalled();
    });
    it('sets invincible on enter, clears on exit', () => {
        const player = makePlayer();
        const state = new DashState(player);
        state.enter();
        expect(player.setInvincible).toHaveBeenCalledWith(true);
        state.exit();
        expect(player.setInvincible).toHaveBeenCalledWith(false);
    });
    it('transitions to idle when timer expires (grounded)', () => {
        const player = makePlayer({ onGround: true });
        const state = new DashState(player);
        state.enter();
        // Advance past DASH_DURATION
        state.update(PHYSICS.DASH_DURATION + 1, input());
        expect(player.switchTo).toHaveBeenCalledWith('idle');
    });
    it('transitions to fall when timer expires (airborne)', () => {
        const player = makePlayer({ onGround: false });
        const state = new DashState(player);
        state.enter();
        state.update(PHYSICS.DASH_DURATION + 1, input());
        expect(player.switchTo).toHaveBeenCalledWith('fall');
    });
});
describe('WallSlideState', () => {
    it('triggers wall jump when jump pressed', () => {
        const player = makePlayer({ onGround: false, wallDirection: 'right' });
        const state = new WallSlideState(player);
        state.enter();
        state.update(16, input({ jumpPressed: true }));
        expect(player.switchTo).toHaveBeenCalledWith('wallJump');
    });
    it('exits to fall when moving away from wall', () => {
        const player = makePlayer({ onGround: false, wallDirection: 'right' });
        const state = new WallSlideState(player);
        state.enter();
        state.update(16, input({ left: true })); // moving away from right wall
        expect(player.switchTo).toHaveBeenCalledWith('fall');
    });
});
//# sourceMappingURL=player-state.test.js.map