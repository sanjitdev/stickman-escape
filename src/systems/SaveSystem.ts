import { SAVE_KEY, WORLDS } from '@/core/Config';

export interface LevelStats {
  bestTime: number;
  deaths: number;
  coinsCollected: number;
  totalCoins: number;
  stars: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  fullscreen: boolean;
}

export interface SaveData {
  unlockedLevels: number[];
  levelStats: Record<number, LevelStats>;
  totalCoins: number;
  settings: GameSettings;
}

const DEFAULT_SAVE: SaveData = {
  unlockedLevels: [1],
  levelStats: {},
  totalCoins: 0,
  settings: { musicVolume: 0.5, sfxVolume: 0.7, fullscreen: false },
};

export class SaveSystem {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      return { ...structuredClone(DEFAULT_SAVE), ...JSON.parse(raw) };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  get settings(): GameSettings {
    return this.data.settings;
  }

  updateSettings(patch: Partial<GameSettings>): void {
    this.data.settings = { ...this.data.settings, ...patch };
    this.save();
  }

  isUnlocked(level: number): boolean {
    return this.data.unlockedLevels.includes(level);
  }

  unlockLevel(level: number): void {
    if (!this.isUnlocked(level)) {
      this.data.unlockedLevels.push(level);
      this.save();
    }
  }

  updateLevelStats(level: number, incoming: LevelStats): void {
    const prev = this.data.levelStats[level];
    this.data.levelStats[level] = {
      bestTime: prev ? Math.min(prev.bestTime, incoming.bestTime) : incoming.bestTime,
      deaths: incoming.deaths,
      coinsCollected: Math.max(prev?.coinsCollected ?? 0, incoming.coinsCollected),
      totalCoins: incoming.totalCoins,
      stars: Math.max(prev?.stars ?? 0, incoming.stars),
    };
    this.data.totalCoins += incoming.coinsCollected;
    this.save();
  }

  getLevelStats(level: number): LevelStats | undefined {
    return this.data.levelStats[level];
  }

  get totalCoins(): number {
    return this.data.totalCoins;
  }

  getWorldForLevel(level: number): (typeof WORLDS)[number] | undefined {
    return WORLDS.find((w) => w.levels.includes(level as never));
  }

  reset(): void {
    this.data = structuredClone(DEFAULT_SAVE);
    this.save();
  }
}

export const saveSystem = new SaveSystem();
