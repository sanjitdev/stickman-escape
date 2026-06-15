import Phaser from 'phaser';

type MusicKey = 'music-forest' | 'music-cave' | 'music-fortress';
export type SfxKey =
  | 'sfx-jump'
  | 'sfx-double-jump'
  | 'sfx-land'
  | 'sfx-dash'
  | 'sfx-coin'
  | 'sfx-key'
  | 'sfx-death'
  | 'sfx-checkpoint'
  | 'sfx-door'
  | 'sfx-stomp'
  | 'sfx-portal'
  | 'sfx-click';

class AudioSystem {
  private scene?: Phaser.Scene;
  private currentMusicKey?: string;
  private currentMusic?: Phaser.Sound.BaseSound;
  private musicVolume = 0.5;
  private sfxVolume = 0.7;
  private isMuted = false;

  init(scene: Phaser.Scene, musicVolume: number, sfxVolume: number): void {
    this.scene = scene;
    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
  }

  playMusic(key: MusicKey): void {
    if (this.currentMusicKey === key) return;
    this.currentMusic?.stop();
    this.currentMusicKey = key;

    if (!this.scene?.cache.audio.has(key)) return;

    this.currentMusic = this.scene.sound.add(key, {
      loop: true,
      volume: this.isMuted ? 0 : this.musicVolume,
    });
    this.currentMusic.play();
  }

  playSfx(key: SfxKey): void {
    if (this.isMuted || !this.scene?.cache.audio.has(key)) return;
    this.scene.sound.play(key, { volume: this.sfxVolume });
  }

  setMusicVolume(v: number): void {
    this.musicVolume = Phaser.Math.Clamp(v, 0, 1);
    if (this.currentMusic && !this.isMuted) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Phaser.Math.Clamp(v, 0, 1);
  }

  mute(): void {
    this.isMuted = true;
    if (this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(0);
    }
  }

  unmute(): void {
    this.isMuted = false;
    if (this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  stopAll(): void {
    this.currentMusic?.stop();
    this.currentMusic = undefined;
    this.currentMusicKey = undefined;
  }

  get muted(): boolean {
    return this.isMuted;
  }
}

export const audioSystem = new AudioSystem();
