import Phaser from 'phaser';
import { GAME, PHYSICS, STAR_THRESHOLDS, WORLDS } from '@/core/Config';
import { Player } from '@/entities/Player';
import { Enemy } from '@/entities/Enemy';
import { Coin } from '@/entities/Coin';
import { Key } from '@/entities/Key';
import { Door } from '@/entities/Door';
import { MovingPlatform } from '@/entities/MovingPlatform';
import { FallingPlatform } from '@/entities/FallingPlatform';
import { InputSystem } from '@/systems/InputSystem';
import { CameraSystem } from '@/systems/CameraSystem';
import { audioSystem } from '@/systems/AudioSystem';
import { saveSystem, type LevelStats } from '@/systems/SaveSystem';
import { HUD } from '@/ui/HUD';

// ─── Config types ─────────────────────────────────────────────────────────────

interface SpawnPoint { x: number; y: number; }
interface RectDef { x: number; y: number; w: number; h: number; }
interface GroundDef { y: number; h: number; }
interface EnemyConfig extends SpawnPoint { patrolStart: number; patrolEnd: number; type: string; }
interface MovingPlatformConfig extends SpawnPoint { path: Array<SpawnPoint>; speed: number; }
interface KeyConfig extends SpawnPoint { id: string; }
interface DoorConfig extends SpawnPoint { keyId: string; }
interface CheckpointConfig extends SpawnPoint { id?: string; }

interface LevelConfig {
  worldWidth: number;
  worldHeight: number;
  ground: GroundDef;
  platforms: RectDef[];
  hazards: RectDef[];
  playerSpawn: SpawnPoint;
  exitPortal: SpawnPoint;
  checkpoints: CheckpointConfig[];
  coins: SpawnPoint[];
  enemies: EnemyConfig[];
  keys: KeyConfig[];
  doors: DoorConfig[];
  movingPlatforms: MovingPlatformConfig[];
  fallingPlatforms: SpawnPoint[];
}

const WORLD_COLORS = {
  ground:   [0x44773a, 0x444477, 0x774444] as const,
  platform: [0x335528, 0x334455, 0x554433] as const,
  bg:       [0x1a3a1a, 0x1a1a2e, 0x2a1a1a] as const,
  hazard: 0xcc2222,
};

function worldIndex(level: number): 0 | 1 | 2 {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  return 2;
}

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private inputSys!: InputSystem;
  private camera!: CameraSystem;
  private hud!: HUD;
  private levelNumber!: number;
  private config!: LevelConfig;

  private solidGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private doors: Door[] = [];

  private elapsedMs = 0;
  private deaths = 0;
  private coinsCollected = 0;
  private totalCoins = 0;
  private activeCheckpoint: SpawnPoint | null = null;
  private levelComplete = false;

  constructor() {
    super('LevelScene');
  }

  init(data: { level: number }): void {
    this.levelNumber = data.level;
    this.elapsedMs = 0;
    this.deaths = 0;
    this.coinsCollected = 0;
    this.activeCheckpoint = null;
    this.levelComplete = false;
    this.doors = [];
  }

  create(): void {
    const raw = this.cache.json.get(`level-config-${this.levelNumber}`) as LevelConfig | null;
    if (!raw) {
      this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, `Level ${this.levelNumber} data not found.\nCheck browser console.`, {
        fontSize: '20px', color: '#ff4444', fontFamily: 'Arial, sans-serif', align: 'center',
      }).setOrigin(0.5);
      return;
    }
    this.config = raw;
    this.totalCoins = this.config.coins.length;

    const wi = worldIndex(this.levelNumber);
    this.cameras.main.setBackgroundColor(WORLD_COLORS.bg[wi]);

    this.buildLevel(wi);
    this.spawnEntities();
    this.createExitPortal();
    this.createCheckpoints();

    this.inputSys = new InputSystem(this);
    this.setupAudio();
    this.setupVirtualButtons();

    this.hud = new HUD(this);
    this.camera = new CameraSystem(this, this.config.worldWidth, this.config.worldHeight);
    this.camera.follow(this.player);
    this.camera.fadeIn();
  }

  // ─── Level geometry ────────────────────────────────────────────────────────

  private buildLevel(wi: 0 | 1 | 2): void {
    const { worldWidth, worldHeight, ground, platforms, hazards } = this.config;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.solidGroup = this.physics.add.staticGroup();

    // Ground floor
    this.addSolidRect(worldWidth / 2, ground.y, worldWidth, ground.h, WORLD_COLORS.ground[wi]);

    // Raised platforms
    platforms.forEach((p) => this.addSolidRect(p.x, p.y, p.w, p.h, WORLD_COLORS.platform[wi]));

    // Spike hazards — drawn as triangles, physics handled via overlap zones
    hazards.forEach((h) => {
      const gfx = this.add.graphics();
      gfx.fillStyle(WORLD_COLORS.hazard);
      const spikeW = 8;
      const count = Math.max(1, Math.floor(h.w / spikeW));
      for (let i = 0; i < count; i++) {
        const sx = h.x - h.w / 2 + i * spikeW;
        gfx.fillTriangle(sx, h.y + h.h / 2, sx + spikeW / 2, h.y - h.h / 2, sx + spikeW, h.y + h.h / 2);
      }
    });

    // Player (created after solidGroup so collider can be registered)
    const { playerSpawn } = this.config;
    this.player = new Player(this, playerSpawn.x, playerSpawn.y);
    this.player.on('died', () => this.onPlayerDied());
    this.player.on('land', () => audioSystem.playSfx('sfx-land'));
    this.player.on('jump', () => audioSystem.playSfx('sfx-jump'));
    this.player.on('double-jump', () => audioSystem.playSfx('sfx-double-jump'));
    this.player.on('dash', () => audioSystem.playSfx('sfx-dash'));

    this.physics.add.collider(this.player, this.solidGroup);

    // Hazard overlap zones
    hazards.forEach((h) => {
      const zone = this.add.zone(h.x, h.y, h.w, h.h);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => this.player.die());
    });
  }

  private addSolidRect(x: number, y: number, w: number, h: number, color: number): void {
    const rect = this.add.rectangle(x, y, w, h, color);
    this.physics.add.existing(rect, true);
    this.solidGroup.add(rect);
  }

  // ─── Entity spawning ──────────────────────────────────────────────────────

  private spawnEntities(): void {
    this.spawnCoins();
    this.spawnEnemies();
    this.spawnKeys();
    this.spawnDoors();
    this.spawnMovingPlatforms();
    this.spawnFallingPlatforms();
  }

  private spawnCoins(): void {
    this.config.coins.forEach((c) => {
      const coin = new Coin(this, c.x, c.y);
      this.physics.add.overlap(this.player, coin, () => {
        if (!coin.active) return;
        coin.collect();
        this.coinsCollected++;
        audioSystem.playSfx('sfx-coin');
      });
    });
  }

  private spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group({ classType: Enemy });
    this.config.enemies.forEach((e) => {
      const enemy = new Enemy(this, e.x, e.y, e.patrolStart, e.patrolEnd);
      this.enemyGroup.add(enemy);
      this.physics.add.collider(enemy, this.solidGroup);
      this.physics.add.overlap(this.player, enemy, () => {
        const body = this.player.arcadeBody;
        if (body.velocity.y > 0 && this.player.y < enemy.y - 10) {
          enemy.stomp();
          this.player.setVelocityY(PHYSICS.JUMP_VELOCITY * 0.6);
          audioSystem.playSfx('sfx-stomp');
        } else if (!this.player.isInvincible) {
          this.player.die();
        }
      });
    });
  }

  private spawnKeys(): void {
    this.config.keys.forEach((kCfg) => {
      const key = new Key(this, kCfg.x, kCfg.y, kCfg.id);
      this.physics.add.overlap(this.player, key, () => {
        if (!key.active) return;
        key.collect();
        audioSystem.playSfx('sfx-key');
        const door = this.doors.find((d) => d.keyId === kCfg.id);
        door?.open();
        if (door) audioSystem.playSfx('sfx-door');
      });
    });
  }

  private spawnDoors(): void {
    this.config.doors.forEach((d) => {
      const door = new Door(this, d.x, d.y, d.keyId);
      this.doors.push(door);
      this.physics.add.collider(this.player, door);
    });
  }

  private spawnMovingPlatforms(): void {
    this.config.movingPlatforms.forEach((mp) => {
      const platform = new MovingPlatform(this, mp.x, mp.y, mp.path, mp.speed);
      this.physics.add.collider(this.player, platform);
    });
  }

  private spawnFallingPlatforms(): void {
    this.config.fallingPlatforms.forEach((fp) => {
      const platform = new FallingPlatform(this, fp.x, fp.y);
      this.physics.add.collider(this.player, platform, () => platform.trigger());
    });
  }

  private createExitPortal(): void {
    const { exitPortal } = this.config;
    const portal = this.add.image(exitPortal.x, exitPortal.y, 'portal');
    this.physics.add.existing(portal, true);
    this.tweens.add({
      targets: portal, y: exitPortal.y - 8,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.physics.add.overlap(this.player, portal, () => {
      if (!this.levelComplete) this.completeLevel();
    });
  }

  private createCheckpoints(): void {
    this.config.checkpoints.forEach((cp) => {
      const sprite = this.add.image(cp.x, cp.y, 'checkpoint');
      const zone = this.add.zone(cp.x, cp.y, 32, 48);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => {
        if (this.activeCheckpoint?.x === cp.x) return;
        this.activeCheckpoint = { x: cp.x, y: cp.y };
        sprite.setTint(0x00ff88);
        audioSystem.playSfx('sfx-checkpoint');
        this.hud.showCheckpoint();
      });
    });
  }

  // ─── Audio / Input / Touch ────────────────────────────────────────────────

  private setupAudio(): void {
    const world = WORLDS.find((w) => w.levels.includes(this.levelNumber as never));
    if (world) {
      audioSystem.init(this, saveSystem.settings.musicVolume, saveSystem.settings.sfxVolume);
      audioSystem.playMusic(world.music);
    }
  }

  private setupVirtualButtons(): void {
    if (!this.sys.game.device.input.touch) return;
    const y = GAME.HEIGHT - 60;
    const style = { fontSize: '28px', color: '#ffffff', fontFamily: 'Arial, sans-serif' };
    const makeBtn = (x: number, label: string, down: () => void, up: () => void) => {
      const btn = this.add.text(x, y, label, style)
        .setOrigin(0.5).setScrollFactor(0).setDepth(60).setAlpha(0.7).setInteractive();
      btn.on('pointerdown', down).on('pointerup', up).on('pointerout', up);
    };
    makeBtn(60, '←', () => { this.inputSys.touchLeft = true; }, () => { this.inputSys.touchLeft = false; });
    makeBtn(130, '→', () => { this.inputSys.touchRight = true; }, () => { this.inputSys.touchRight = false; });
    makeBtn(GAME.WIDTH - 130, '⬆', () => { this.inputSys.touchJump = true; }, () => { this.inputSys.touchJump = false; });
    makeBtn(GAME.WIDTH - 60, '⚡', () => { this.inputSys.touchDash = true; }, () => { this.inputSys.touchDash = false; });
  }

  // ─── Game events ──────────────────────────────────────────────────────────

  private onPlayerDied(): void {
    this.deaths++;
    this.camera.shake();
    audioSystem.playSfx('sfx-death');
    this.time.delayedCall(800, () => {
      const spawn = this.activeCheckpoint ?? this.config.playerSpawn;
      this.player.respawn(spawn.x, spawn.y);
    });
  }

  private completeLevel(): void {
    this.levelComplete = true;
    audioSystem.playSfx('sfx-portal');
    const stats = this.buildStats();
    saveSystem.updateLevelStats(this.levelNumber, stats);
    if (this.levelNumber < GAME.TOTAL_LEVELS) saveSystem.unlockLevel(this.levelNumber + 1);
    this.camera.fadeOut(500, () => {
      this.scene.start('VictoryScene', { level: this.levelNumber, stats });
    });
  }

  private buildStats(): LevelStats {
    const { THREE, TWO } = STAR_THRESHOLDS;
    const coinRatio = this.totalCoins > 0 ? this.coinsCollected / this.totalCoins : 1;
    const stars =
      this.deaths <= THREE.maxDeaths && coinRatio >= THREE.minCoinRatio ? 3
      : this.deaths <= TWO.maxDeaths && coinRatio >= TWO.minCoinRatio ? 2
      : 1;
    return {
      bestTime: this.elapsedMs,
      deaths: this.deaths,
      coinsCollected: this.coinsCollected,
      totalCoins: this.totalCoins,
      stars,
    };
  }

  // ─── Game loop ────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.levelComplete || !this.player) return;

    this.elapsedMs += delta;
    this.inputSys.update(delta);

    const state = this.inputSys.state;
    this.player.update(delta, state);
    (this.enemyGroup?.getChildren() as Enemy[]).forEach((e) => e.update(delta));
    this.hud.update(this.elapsedMs, this.coinsCollected, this.totalCoins, this.deaths);

    if (state.pause) {
      this.scene.pause('LevelScene');
      this.scene.launch('PauseScene', { level: this.levelNumber });
    }
  }
}
