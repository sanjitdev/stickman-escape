import Phaser from 'phaser';
import { GAME, PHYSICS } from './Config';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { LevelScene } from '../scenes/LevelScene';
import { PauseScene } from '../scenes/PauseScene';
import { SettingsScene } from '../scenes/SettingsScene';
import { GameOverScene } from '../scenes/GameOverScene';
import { VictoryScene } from '../scenes/VictoryScene';

export function createGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    backgroundColor: '#1a1a2e',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: PHYSICS.GRAVITY },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      LevelSelectScene,
      LevelScene,
      PauseScene,
      SettingsScene,
      GameOverScene,
      VictoryScene,
    ],
  });
}
