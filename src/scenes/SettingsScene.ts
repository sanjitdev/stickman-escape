import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { Button } from '@/ui/Button';
import { audioSystem } from '@/systems/AudioSystem';
import { saveSystem } from '@/systems/SaveSystem';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('SettingsScene');
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME;
    const settings = saveSystem.settings;

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0d1b2a);

    this.add.text(WIDTH / 2, 60, 'SETTINGS', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    this.createSlider(WIDTH / 2, 180, 'Music Volume', settings.musicVolume, (v) => {
      saveSystem.updateSettings({ musicVolume: v });
      audioSystem.setMusicVolume(v);
    });

    this.createSlider(WIDTH / 2, 260, 'SFX Volume', settings.sfxVolume, (v) => {
      saveSystem.updateSettings({ sfxVolume: v });
      audioSystem.setSfxVolume(v);
    });

    // Fullscreen toggle
    const fsLabel = settings.fullscreen ? 'Fullscreen: ON' : 'Fullscreen: OFF';
    const fsBtn = new Button(this, WIDTH / 2, 340, {
      text: fsLabel,
      onClick: () => {
        const on = !saveSystem.settings.fullscreen;
        saveSystem.updateSettings({ fullscreen: on });
        fsBtn.setText(on ? 'Fullscreen: ON' : 'Fullscreen: OFF');
        if (on) this.scale.startFullscreen();
        else this.scale.stopFullscreen();
      },
    });

    new Button(this, WIDTH / 2, HEIGHT - 80, {
      text: '← BACK',
      onClick: () => {
        // Return to whichever scene launched us
        if (this.scene.isPaused('LevelScene')) {
          this.scene.wake('PauseScene');
        } else {
          this.scene.start('MainMenuScene');
        }
        this.scene.stop();
      },
    });

    this.cameras.main.fadeIn(300);
  }

  private createSlider(
    cx: number,
    cy: number,
    label: string,
    initial: number,
    onChange: (v: number) => void,
  ): void {
    const W = 300;

    this.add.text(cx, cy - 24, label, {
      fontSize: '18px', color: '#aaccff', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    const track = this.add.rectangle(cx, cy, W, 8, 0x333333);
    const fill = this.add.rectangle(cx - W / 2 + (W * initial) / 2, cy, W * initial, 8, 0x4a6fa5);
    fill.setOrigin(0, 0.5).setX(cx - W / 2);

    const thumb = this.add.circle(cx - W / 2 + W * initial, cy, 12, 0xffffff)
      .setInteractive({ draggable: true });

    const trackLeft = cx - W / 2;
    const trackRight = cx + W / 2;

    this.input.setDraggable(thumb);
    this.input.on('drag', (_: Phaser.Input.Pointer, obj: Phaser.GameObjects.Arc, x: number) => {
      if (obj !== thumb) return;
      const clamped = Phaser.Math.Clamp(x, trackLeft, trackRight);
      thumb.setX(clamped);
      const ratio = (clamped - trackLeft) / W;
      fill.setDisplaySize(W * ratio, 8);
      onChange(ratio);
    });

    void track;
  }
}
