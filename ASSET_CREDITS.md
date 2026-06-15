# Asset Credits

All assets are CC0 (public domain). No attribution legally required; credited here for transparency.

## Pixel Frog — Pixel Adventure 1

| Content | URL |
|---|---|
| Player sprites, enemy sprites, fruits, traps, checkpoints, terrain | https://pixelfrog-assets.itch.io/pixel-adventure-1 |

License: **CC0** — copy, modify, distribute, even commercially, no permission needed.

### File Placement

Download `Pixel Adventure 1.zip` from the link above and place files as follows:

```
public/assets/sprites/
  player-idle.png        ← Main Characters/Virtual Guy/Idle (11 frames).png
  player-run.png         ← Main Characters/Virtual Guy/Run (12 frames).png
  player-jump.png        ← Main Characters/Virtual Guy/Jump (1 frame).png
  player-fall.png        ← Main Characters/Virtual Guy/Fall (1 frame).png
  player-doublejump.png  ← Main Characters/Virtual Guy/Double Jump (6 frames).png
  player-walljump.png    ← Main Characters/Virtual Guy/Wall Jump (5 frames).png
  player-hit.png         ← Main Characters/Virtual Guy/Hit (7 frames).png

  enemy-run.png          ← Enemies/Mushroom/Run (14 frames).png
  enemy-hit.png          ← Enemies/Mushroom/Hit (8 frames).png

  fruit-apple.png        ← Items/Fruits/Apple (17 frames).png

  trap-saw.png           ← Traps/Saw/On (8 frames).png
  trap-spike.png         ← Traps/Spikes/Idle.png

  checkpoint.png         ← Items/Checkpoints/Checkpoint (No Flag).png
  checkpoint-idle.png    ← Items/Checkpoints/Checkpoint (Flag Idle)(10 frames).png
  checkpoint-out.png     ← Items/Checkpoints/Checkpoint (Flag Out)(10 frames).png

  tiles.png              ← Terrain/Terrain (96x16).png
  bg-forest.png          ← Background/Green.png
  bg-cave.png            ← Background/Brown.png
  bg-fortress.png        ← Background/Gray.png
```

### Sprite Sheet Dimensions

| Key | Frame size | Frame count |
|---|---|---|
| player-idle | 32×32 | 11 |
| player-run | 32×32 | 12 |
| player-jump | 32×32 | 1 |
| player-fall | 32×32 | 1 |
| player-doublejump | 32×32 | 6 |
| player-walljump | 32×32 | 5 |
| player-hit | 32×32 | 7 |
| enemy-run | 32×32 | 14 |
| enemy-hit | 32×32 | 8 |
| fruit-apple | 32×32 | 17 |
| trap-saw | 38×38 | 8 |
| checkpoint-idle | 64×64 | 10 |
| checkpoint-out | 64×64 | 10 |

> All animations run at **20 FPS** (50 ms per frame) as per PA1 spec.

> **Note:** If the Mushroom enemy PNGs use 16×16 frames instead of 32×32,
> update `frameWidth`/`frameHeight` in `PreloadScene.ts` accordingly.

## Kenney.nl — UI / Audio (still in use)

| Pack | URL | Usage |
|---|---|---|
| UI Pack | https://kenney.nl/assets/ui-pack | Buttons, panels |
| Interface Sounds | https://kenney.nl/assets/interface-sounds | UI click SFX |
| RPG Audio | https://kenney.nl/assets/rpg-audio | Jump, land, hit, coin SFX |
| Music Jingles | https://kenney.nl/assets/music-jingles | Per-world background music |

```
public/assets/audio/
  music-forest.ogg / .mp3
  music-cave.ogg / .mp3
  music-fortress.ogg / .mp3
  sfx-jump.ogg        sfx-double-jump.ogg
  sfx-land.ogg        sfx-dash.ogg
  sfx-coin.ogg        sfx-key.ogg
  sfx-death.ogg       sfx-checkpoint.ogg
  sfx-door.ogg        sfx-stomp.ogg
  sfx-portal.ogg      sfx-click.ogg
```
