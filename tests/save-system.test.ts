import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from '@/systems/SaveSystem';

// Each test gets a fresh instance backed by a fresh localStorage
function makeSave(): SaveSystem {
  localStorage.clear();
  return new SaveSystem();
}

describe('SaveSystem', () => {
  let save: SaveSystem;
  beforeEach(() => { save = makeSave(); });

  it('starts with level 1 unlocked only', () => {
    expect(save.isUnlocked(1)).toBe(true);
    expect(save.isUnlocked(2)).toBe(false);
  });

  it('unlocks level and persists across instances', () => {
    save.unlockLevel(2);
    const reloaded = new SaveSystem();
    expect(reloaded.isUnlocked(2)).toBe(true);
  });

  it('does not double-unlock a level', () => {
    save.unlockLevel(2);
    save.unlockLevel(2);
    const reloaded = new SaveSystem();
    const count = reloaded['data'].unlockedLevels.filter((l: number) => l === 2).length;
    expect(count).toBe(1);
  });

  it('tracks best time (lower wins)', () => {
    save.updateLevelStats(1, { bestTime: 5000, deaths: 2, coinsCollected: 8, totalCoins: 10, stars: 2 });
    save.updateLevelStats(1, { bestTime: 3000, deaths: 0, coinsCollected: 10, totalCoins: 10, stars: 3 });
    expect(save.getLevelStats(1)!.bestTime).toBe(3000);
  });

  it('tracks best time (higher not stored)', () => {
    save.updateLevelStats(1, { bestTime: 3000, deaths: 0, coinsCollected: 10, totalCoins: 10, stars: 3 });
    save.updateLevelStats(1, { bestTime: 8000, deaths: 5, coinsCollected: 5, totalCoins: 10, stars: 1 });
    expect(save.getLevelStats(1)!.bestTime).toBe(3000);
  });

  it('accumulates totalCoins across levels', () => {
    save.updateLevelStats(1, { bestTime: 3000, deaths: 0, coinsCollected: 8, totalCoins: 10, stars: 2 });
    save.updateLevelStats(2, { bestTime: 4000, deaths: 1, coinsCollected: 6, totalCoins: 10, stars: 2 });
    expect(save.totalCoins).toBe(14);
  });

  it('updates settings and persists them', () => {
    save.updateSettings({ musicVolume: 0.2, sfxVolume: 0.9 });
    const reloaded = new SaveSystem();
    expect(reloaded.settings.musicVolume).toBeCloseTo(0.2);
    expect(reloaded.settings.sfxVolume).toBeCloseTo(0.9);
  });

  it('returns best star count across runs', () => {
    save.updateLevelStats(1, { bestTime: 5000, deaths: 2, coinsCollected: 5, totalCoins: 10, stars: 1 });
    save.updateLevelStats(1, { bestTime: 4000, deaths: 1, coinsCollected: 7, totalCoins: 10, stars: 2 });
    expect(save.getLevelStats(1)!.stars).toBe(2);
  });

  it('reset clears all data', () => {
    save.unlockLevel(2);
    save.reset();
    const reloaded = new SaveSystem();
    expect(reloaded.isUnlocked(2)).toBe(false);
    expect(reloaded.totalCoins).toBe(0);
  });
});
