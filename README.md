# Stickman Escape

A 2D platformer built with **Phaser 3 + TypeScript + Vite**. 7 hand-designed levels across 3 worlds (Forest → Cave → Fortress), with a class-based player FSM, pooled entities, JSON-driven levels, and GitHub Actions CI/CD.

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:5173/stickman-escape/
```

## Setup — Assets (required for visuals/audio)

The game ships with procedural placeholder textures so it runs immediately. For full Kenney CC0 art:

| Purpose | Pack | Destination |
|---|---|---|
| Tiles + Characters | [New Platformer Pack](https://kenney.nl/assets/new-platformer-pack) | `public/assets/sprites/` |
| Pixel tiles | [Pixel Platformer](https://kenney.nl/assets/pixel-platformer) | `public/assets/sprites/tiles.png` |
| Particle textures | [Particle Pack](https://kenney.nl/assets/particle-pack) | `public/assets/particles/` |
| UI | [UI Pack](https://kenney.nl/assets/ui-pack) | `public/assets/sprites/` |
| SFX | [Interface Sounds](https://kenney.nl/assets/interface-sounds) + [RPG Audio](https://kenney.nl/assets/rpg-audio) | `public/assets/audio/` |
| Music | [Music Jingles](https://kenney.nl/assets/music-jingles) | `public/assets/audio/` |

Expected filenames: see `src/scenes/PreloadScene.ts` for the full asset key → path mapping.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript check + production bundle → `dist/` |
| `npm run lint` | ESLint across `src/` |
| `npm test` | Vitest (save system, level schema, player FSM) |
| `node scripts/generate-tilemaps.mjs` | Regenerate `public/assets/tilemaps/level-N.json` |

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → / A D | D-Pad |
| Jump | ↑ / Space | ⬆ button |
| Dash | Shift | ⚡ button |
| Pause | Esc | — |

## Architecture

```
src/
  core/         Config.ts · Game.ts
  scenes/       Boot · Preload · MainMenu · LevelSelect · Level · Pause · Settings · GameOver · Victory
  entities/     Player · Enemy · Coin · Key · Door · MovingPlatform · FallingPlatform
    states/     PlayerState (abstract) · Idle · Run · Jump · Fall · WallSlide · WallJump · Dash · Dead
  systems/      Input · Audio · Save · Camera · Collision
  ui/           Button · Modal · HUD
public/
  assets/
    tilemaps/   level-1.json … level-7.json   (Tiled JSON, auto-generated)
    data/       levels/level-1.json … level-7.json (entity configs)
    sprites/    (Kenney assets, user-supplied)
    audio/      (Kenney assets, user-supplied)
tests/          save-system · level-loader · player-state
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full deep-dive.

## Deployment

Push to `main` → GitHub Actions runs lint + tests + build → deploys to `gh-pages` branch.

Live URL: `https://<your-username>.github.io/stickman-escape/`

Enable GitHub Pages: **Settings → Pages → Source: gh-pages branch**.

## License

Code: MIT. Assets: CC0 (Kenney.nl).
