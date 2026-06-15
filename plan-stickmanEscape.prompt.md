# Plan: Stickman Escape — Production Browser Game

**TL;DR**: Full 9-phase build of a Phaser 3 + TypeScript + Vite 2D platformer. JSON-driven level system with Tiled tilemaps, class-based player FSM, Kenney CC0 assets throughout, Vitest unit tests, and GitHub Actions → GitHub Pages CI/CD.

---

## Asset Strategy (all CC0 — no attribution legally required, but credited)

| Purpose | Kenney Pack |
|---|---|
| Tiles + Characters + Backgrounds | **New Platformer Pack** — kenney.nl/assets/new-platformer-pack |
| Pixel tiles (world variety) | **Pixel Platformer** — kenney.nl/assets/pixel-platformer |
| Particle textures | **Particle Pack** — kenney.nl/assets/particle-pack |
| UI buttons / panels / sliders | **UI Pack** — kenney.nl/assets/ui-pack |
| UI click/confirm sounds | **Interface Sounds** — kenney.nl/assets/interface-sounds |
| Jump, land, hit SFX | **RPG Audio** — kenney.nl/assets/rpg-audio |
| Per-world music loops | **Music Jingles** — kenney.nl/assets/music-jingles |

---

## Architecture

**Scene flow**:
```
Boot → Preload → MainMenu
                   ├── LevelSelect → LevelScene ──► VictoryScene
                   ├── Settings                ├──► GameOverScene
                   └── Credits            PauseScene (overlay)
```

**Player FSM** — 8 concrete state classes (`IdleState`, `RunState`, `JumpState`, `FallState`, `WallSlideState`, `WallJumpState`, `DashState`, `DeadState`), all extend abstract `PlayerState` with `enter() / update(dt, input) / exit()`. `Player.switchState()` enforces exit → enter ordering. Physics constants isolated in `Config.ts PHYSICS` object.

**Level data — two files per level**:
- `public/assets/tilemaps/level-N.json` — Tiled JSON (3 layers: Background, Platforms, Hazards; collision via `collides: true` custom property on tiles)
- `src/data/levels/level-N.json` — entity config (enemies, coins, moving platforms, keys, doors, checkpoints, exit portal position)

**Save data** (`localStorage` key `stickman-escape-save`):
```
{ unlockedLevels: number[], levelStats: Record<number, LevelStats>, totalCoins: number, settings: GameSettings }
```

**Object pooling**: `Phaser.GameObjects.Group` with `classType: Coin`, `maxSize: 50`, `getFirstDead()` pattern.

---

## Physics Constants (`Config.ts`)

| Constant | Value |
|---|---|
| `GRAVITY` | 600 |
| `RUN_SPEED` | 200 px/s |
| `JUMP_VELOCITY` | −500 |
| `DOUBLE_JUMP_VELOCITY` | −420 |
| `WALL_JUMP` | `{x: 280, y: −460}` |
| `DASH_SPEED / DURATION / COOLDOWN` | 650 / 180ms / 800ms |
| `WALL_SLIDE_VELOCITY` | 80 |
| `ACCELERATION / DECELERATION` | 1200 / 1800 |
| `COYOTE_TIME` | 150ms |
| `JUMP_BUFFER_TIME` | 100ms |
| `VARIABLE_JUMP_MULTIPLIER` | 0.5× (on early release) |

---

## Phase Breakdown

### Phase 1 — Project Setup *(no dependencies)*
1. `package.json` with deps: `phaser@^3`, `typescript`, `vite`, `vitest`, `eslint`, `prettier`
2. `vite.config.ts` — `base: '/stickman-escape/'`, `publicDir: 'public'`
3. `tsconfig.json` — strict, ESNext, path aliases (`@/` → `src/`)
4. `.eslintrc.json` + `.prettierrc`
5. `index.html` — canvas mount, `type="module"` entry
6. `src/core/Config.ts` — all constants, world definitions
7. `src/core/Game.ts` — `Phaser.Game` factory, `Scale.FIT` mode, all scenes registered

### Phase 2 — Player Controller *(depends on Phase 1)*
1. `src/systems/InputSystem.ts` — maps keyboard (WASD/Arrows/Space/Shift) + touch flags into typed `InputState`; manages 100ms jump buffer timer
2. `src/entities/Player.ts` — `Arcade.Sprite` subclass owning the FSM; tracks coyote timer, dash cooldown, wall contact direction, jump count
3. Eight state classes (inline or `src/entities/states/`)
4. Hook into `LevelScene.update(dt)` via `player.update(dt, input.state)`

### Phase 3 — Level System *(parallel with Phase 2)*
1. Seven `src/data/levels/level-N.json` entity configs (all game objects, paths, patrol ranges)
2. Seven `public/assets/tilemaps/level-N.json` Tiled maps with `collides: true` property
3. `src/entities/Coin.ts` — pooled, `collect()` triggers scale tween + audio event
4. `src/entities/Key.ts` — overlap detection, emits typed `key-collected` event
5. `src/entities/Door.ts` — listens for `key-collected`, plays open animation
6. `MovingPlatform` + `FallingPlatform` — `Arcade.Image` with tween path / delayed fall
7. `src/systems/CollisionSystem.ts` — single point registering all colliders/overlaps
8. `src/systems/CameraSystem.ts` — lerp follow (`lerpX/Y: 0.1`), bounds, `shake(intensity, duration)`
9. `src/scenes/LevelScene.ts` — tilemap loader, entity spawner, game loop orchestrator

### Phase 4 — Enemies *(depends on Phase 3)*
1. `src/entities/Enemy.ts` — patrol FSM: Idle → Walk → Turn; reverses at ledge edge or wall normal
2. Player overlap → death; player dash/stomp → enemy defeated + coin drop
3. Enemy death particle burst

### Phase 5 — UI *(parallel with Phase 3)*
1. `src/ui/Button.ts` — interactive image with pointerover/down/up states
2. `src/ui/Modal.ts` — semi-transparent backdrop + panel container
3. All 8 scenes: Boot, Preload (progress bar), MainMenu, LevelSelect (grid + lock states), Pause (overlay), GameOver, Victory (star rating), Settings (sliders + fullscreen toggle)
4. `src/ui/HUD.ts` — coin counter, elapsed timer, death count, checkpoint indicator

### Phase 6 — Audio *(parallel with Phase 5)*
1. `src/systems/AudioSystem.ts` — singleton: `playMusic(key)`, `playSfx(key)`, `setMusicVolume(v)`, `setSfxVolume(v)`, `mute()`
2. Per-world music; SFX: jump, double-jump, land, dash, coin-collect, key-collect, death, checkpoint, door-open, enemy-stomp, portal
3. Volume state read from `SaveSystem` on boot

### Phase 7 — Polish *(depends on Phases 2–6)*
1. Particle emitters: death burst, coin sparkle, dash trail, checkpoint ring, portal swirl (using Kenney Particle Pack textures)
2. Screen shake on death, enemy stomp, spike hit
3. Scene fade transitions (`cameras.main.fadeIn/Out`)
4. Mobile virtual D-Pad + Jump + Dash buttons (visible only on touch devices via `device.touch`)

### Phase 8 — Testing *(parallel with Phase 7)*
1. `vitest.config.ts` — `environment: 'node'`, `globals: true`
2. `tests/save-system.test.ts` — serialize, deserialize, unlock gating, best-time update, `totalCoins` accumulation
3. `tests/level-loader.test.ts` — JSON schema validation, missing required fields, entity count assertions
4. `tests/player-state.test.ts` — state transitions: idle→run, idle→jump, jump→fall, fall→wallSlide, coyote window, dash cooldown enforcement

### Phase 9 — Deployment *(depends on all)*
1. `.github/workflows/deploy.yml` — Node 20, `npm ci` → `npm run lint` → `npm test` → `npm run build` → `peaceiris/actions-gh-pages@v3` to `gh-pages` branch
2. `README.md` — setup, dev, build, deploy, controls, architecture overview
3. `ARCHITECTURE.md` — game loop deep-dive, scene flow, FSM design, save system, asset pipeline
4. `ASSET_CREDITS.md` — all 7 Kenney packs, URLs, CC0 license statement, file mappings

---

## 7 Level Design Outline

| Level | World | Theme | Key Mechanic Introduced |
|---|---|---|---|
| 1 | Forest | Tutorial | Run, jump, coins, basic platforms |
| 2 | Forest | Rising | Double jump, falling platforms, first enemy |
| 3 | Cave | Dark descent | Wall slide, wall jump, spike hazards |
| 4 | Cave | Flooded | Moving platforms, keys + locked doors |
| 5 | Fortress | Battlements | Dash, enemy clusters, checkpoints |
| 6 | Fortress | Trap halls | All mechanics combined, tighter timing |
| 7 | Fortress | Escape | Full gauntlet — boss-level density |

---

## Full File List

```
package.json
vite.config.ts
tsconfig.json
.eslintrc.json
.prettierrc
index.html
src/
  core/
    Config.ts
    Game.ts
  scenes/
    BootScene.ts
    PreloadScene.ts
    MainMenuScene.ts
    LevelScene.ts
    PauseScene.ts
    SettingsScene.ts
    GameOverScene.ts
    VictoryScene.ts
  entities/
    Player.ts
    Enemy.ts
    Coin.ts
    Key.ts
    Door.ts
    MovingPlatform.ts
    FallingPlatform.ts
    states/
      PlayerState.ts
      IdleState.ts
      RunState.ts
      JumpState.ts
      FallState.ts
      WallSlideState.ts
      WallJumpState.ts
      DashState.ts
      DeadState.ts
  systems/
    InputSystem.ts
    AudioSystem.ts
    SaveSystem.ts
    CameraSystem.ts
    CollisionSystem.ts
  ui/
    HUD.ts
    Button.ts
    Modal.ts
  data/
    levels/
      level-1.json
      level-2.json
      level-3.json
      level-4.json
      level-5.json
      level-6.json
      level-7.json
public/
  assets/
    sprites/
    tilemaps/
      level-1.json … level-7.json
    audio/
    particles/
tests/
  save-system.test.ts
  level-loader.test.ts
  player-state.test.ts
vitest.config.ts
.github/
  workflows/
    deploy.yml
README.md
ARCHITECTURE.md
ASSET_CREDITS.md
```

---

## Verification

1. `npm run dev` → game at `localhost:5173`, main menu renders, player loads in level 1
2. `npm run lint` → zero errors
3. `npm run test` → all 3 test suites pass
4. `npm run build` → `dist/` produced, ≤6MB bundle
5. Manual: complete all 7 levels; deaths/coins persist after page reload
6. Manual: mobile emulation (Chrome DevTools) shows virtual D-Pad, game plays correctly
7. Git push to `main` → GitHub Actions passes → game live at `https://<user>.github.io/stickman-escape/`

---

## Scope Boundaries

- **Included**: 7 hand-designed levels, all listed mechanics, desktop + mobile, save persist, full CI/CD
- **Excluded**: multiplayer, procedural generation, in-game level editor, analytics, leaderboards
- **No SVG**: all visuals are PNG sprite sheets from Kenney
- **npm** package manager (as specified; no pnpm/yarn)

---

## Open Questions

1. **Character art**: Kenney's New Platformer Pack uses cartoon characters, not literal stick figures. Use those (cohesive style) or source a dedicated stickman sprite from OpenGameArt (slightly mismatched style)?
2. **Tiled project files**: Include `.tmx` Tiled project files alongside the JSON (so maps are editable in Tiled GUI), or JSON-only?
3. **Level layout complexity**: Simple rectangular layouts (faster to generate, still playable) or complex multi-path branching layouts?
