import Phaser from 'phaser';
import { GAME } from '@/core/Config';
import { saveSystem } from '@/systems/SaveSystem';

const LEVEL_WORLDS = [
  { name: 'Forest',   levels: [1, 2],    accent: 0x3a8a3a, glow: 0x66ff66, bgTop: 0x051a05, bgBot: 0x0d2e0d },
  { name: 'Cave',     levels: [3, 4],    accent: 0x3a3a9a, glow: 0x6688ff, bgTop: 0x050512, bgBot: 0x0d0d25 },
  { name: 'Fortress', levels: [5, 6, 7], accent: 0x9a3a3a, glow: 0xff6655, bgTop: 0x150505, bgBot: 0x280808 },
] as const;

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create(): void {
    const { WIDTH, HEIGHT } = GAME;
    const rng = new Phaser.Math.RandomDataGenerator(['level-select-bg']);

    // ── Background ────────────────────────────────────────────────────────────
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x050d1a, 0x050d1a, 0x0a2240, 0x0a2240);
    sky.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    const stars = this.add.graphics();
    for (let i = 0; i < 150; i++) {
      stars.fillStyle(0xffffff, rng.realInRange(0.3, 0.9));
      stars.fillCircle(rng.integerInRange(0, WIDTH), rng.integerInRange(0, HEIGHT * 0.65), rng.realInRange(0.4, 1.5));
    }
    this.tweens.add({ targets: stars, alpha: { from: 0.6, to: 1 }, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Drifting clouds
    [[HEIGHT * 0.07, 200, 58, 34000, 0], [HEIGHT * 0.13, 160, 44, 26000, 10000], [HEIGHT * 0.09, 290, 76, 44000, 20000]].forEach(([y, w, h, dur, delay]) => {
      const g = this.add.graphics().setAlpha(0.18);
      g.fillStyle(0x8ab4d0);
      g.fillEllipse(0, h * 0.15, w * 0.55, h * 0.70); g.fillEllipse(-w * 0.25, h * 0.25, w * 0.38, h * 0.55);
      g.fillEllipse(w * 0.25, h * 0.25, w * 0.38, h * 0.55); g.fillEllipse(-w * 0.15, h * 0.05, w * 0.40, h * 0.60);
      g.x = WIDTH + w; g.y = y;
      this.tweens.add({ targets: g, x: { from: WIDTH + w, to: -w }, duration: dur, delay, repeat: -1, ease: 'Linear', onRepeat: () => { g.x = WIDTH + w; } });
    });

    // Mountain silhouettes
    const mtn = this.add.graphics();
    mtn.fillStyle(0x0b1e30);
    for (let x = -80; x < WIDTH + 80; x += 190) { const h = rng.integerInRange(70, 150); mtn.fillTriangle(x, HEIGHT * 0.72, x + 95, HEIGHT * 0.72 - h, x + 190, HEIGHT * 0.72); }

    // Tree silhouettes
    const trees = this.add.graphics();
    trees.fillStyle(0x040c08);
    for (let x = -20; x < WIDTH + 20; x += rng.integerInRange(30, 60)) {
      const th = rng.integerInRange(50, 120), tw = rng.integerInRange(20, 40);
      trees.fillRect(x + tw / 2 - 4, HEIGHT - th, 8, th);
      trees.fillTriangle(x, HEIGHT - th * 0.38, x + tw / 2, HEIGHT - th - 35, x + tw, HEIGHT - th * 0.38);
      trees.fillTriangle(x + 5, HEIGHT - th * 0.55, x + tw / 2, HEIGHT - th - 56, x + tw - 5, HEIGHT - th * 0.55);
    }

    // ── Title ──────────────────────────────────────────────────────────────────
    this.add.text(WIDTH / 2 + 3, 36, 'SELECT LEVEL', {
      fontSize: '36px', color: '#001133', fontFamily: 'Arial Black, Arial, sans-serif',
    }).setOrigin(0.5);
    const titleText = this.add.text(WIDTH / 2, 33, 'SELECT LEVEL', {
      fontSize: '36px', color: '#ffffff', fontFamily: 'Arial Black, Arial, sans-serif',
      stroke: '#1a3a6e', strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0);

    // Thin decorative lines under title
    const titleRule = this.add.graphics().setAlpha(0);
    titleRule.lineStyle(1, 0x4488ff, 0.5);
    titleRule.lineBetween(WIDTH / 2 - 180, 60, WIDTH / 2 - 12, 60);
    titleRule.lineBetween(WIDTH / 2 + 12, 60, WIDTH / 2 + 180, 60);

    // ── World cards ────────────────────────────────────────────────────────────
    const cardW = 240, cardH = 300;
    const totalW = LEVEL_WORLDS.length * cardW + (LEVEL_WORLDS.length - 1) * 30;
    const cardsStartX = (WIDTH - totalW) / 2 + cardW / 2;
    const cardY = HEIGHT / 2 + 20;

    const cardContainers: Phaser.GameObjects.Container[] = [];

    LEVEL_WORLDS.forEach((world, wi) => {
      const cx = cardsStartX + wi * (cardW + 30);
      const container = this.add.container(cx, cardY + 40).setAlpha(0);
      cardContainers.push(container);

      // Card background with gradient border
      const cardBg = this.add.graphics();
      cardBg.fillStyle(world.bgTop, 0.92);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      cardBg.lineStyle(2, world.accent, 0.8);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
      container.add(cardBg);

      // Glow top edge
      const topGlow = this.add.graphics();
      topGlow.fillStyle(world.glow, 0.12);
      topGlow.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, 40, { tl: 14, tr: 14, bl: 0, br: 0 });
      container.add(topGlow);

      // World name
      const worldLabel = this.add.text(0, -cardH / 2 + 22, world.name.toUpperCase(), {
        fontSize: '17px', color: Phaser.Display.Color.IntegerToColor(world.glow).rgba,
        fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: 3,
      }).setOrigin(0.5);
      container.add(worldLabel);

      // Divider
      const div = this.add.graphics();
      div.lineStyle(1, world.accent, 0.5);
      div.lineBetween(-cardW / 2 + 20, -cardH / 2 + 44, cardW / 2 - 20, -cardH / 2 + 44);
      container.add(div);

      // Level buttons inside card
      const lvlCount = world.levels.length;
      const lvlSpacingY = 70;
      const lvlStartY = -cardH / 2 + 80;

      world.levels.forEach((level, li) => {
        const unlocked = saveSystem.isUnlocked(level);
        const stats = saveSystem.getLevelStats(level);
        const ly = lvlStartY + li * lvlSpacingY;

        // Level row background
        const rowBg = this.add.graphics();
        rowBg.fillStyle(unlocked ? world.accent : 0x1a1a1a, unlocked ? 0.25 : 0.4);
        rowBg.fillRoundedRect(-cardW / 2 + 14, ly - 26, cardW - 28, 52, 8);
        if (unlocked) {
          rowBg.lineStyle(1, world.accent, 0.5);
          rowBg.strokeRoundedRect(-cardW / 2 + 14, ly - 26, cardW - 28, 52, 8);
        }
        container.add(rowBg);

        // Level number badge
        const badge = this.add.graphics();
        const badgeColor = unlocked ? world.glow : 0x444444;
        badge.fillStyle(badgeColor, unlocked ? 0.25 : 0.15);
        badge.fillCircle(-cardW / 2 + 46, ly, 20);
        badge.lineStyle(2, badgeColor, unlocked ? 0.8 : 0.3);
        badge.strokeCircle(-cardW / 2 + 46, ly, 20);
        container.add(badge);

        const numText = this.add.text(-cardW / 2 + 46, ly, String(level), {
          fontSize: '18px', color: unlocked ? '#ffffff' : '#444444',
          fontFamily: 'Arial Black, Arial, sans-serif',
        }).setOrigin(0.5);
        container.add(numText);

        if (!unlocked) {
          const lock = this.add.text(-cardW / 2 + 46, ly, '🔒', {
            fontSize: '14px', fontFamily: 'Arial, sans-serif',
          }).setOrigin(0.5);
          container.add(lock);
          numText.setAlpha(0);
        }

        // Stars
        const starsText = this.add.text(-cardW / 2 + 76, ly + 6, stats ? '★'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars) : '☆☆☆', {
          fontSize: '15px', color: stats?.stars ? '#ffcc00' : (unlocked ? '#445566' : '#2a2a2a'),
          fontFamily: 'Arial, sans-serif',
        });
        container.add(starsText);

        // Best time
        if (stats?.timeMs) {
          const secs = Math.floor(stats.timeMs / 1000);
          const timeStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
          const timeLabel = this.add.text(-cardW / 2 + 76, ly - 8, `⏱ ${timeStr}`, {
            fontSize: '12px', color: '#6699aa', fontFamily: 'Arial, sans-serif',
          });
          container.add(timeLabel);
        } else if (unlocked) {
          const newTag = this.add.text(-cardW / 2 + 76, ly - 9, stats ? 'PLAY AGAIN' : 'NEW', {
            fontSize: '11px', color: Phaser.Display.Color.IntegerToColor(world.glow).rgba,
            fontFamily: 'Arial, sans-serif',
          });
          container.add(newTag);
        }

        // Click zone
        if (unlocked) {
          const hitZone = this.add.zone(-cardW / 2 + 14 + (cardW - 28) / 2, ly, cardW - 28, 52)
            .setInteractive({ useHandCursor: true });
          container.add(hitZone);

          hitZone.on('pointerover', () => {
            this.tweens.add({ targets: rowBg, alpha: 1.0, duration: 120 });
          });
          hitZone.on('pointerout', () => {
            this.tweens.add({ targets: rowBg, alpha: 1.0, duration: 120 });
            rowBg.clear();
            rowBg.fillStyle(world.accent, 0.25);
            rowBg.fillRoundedRect(-cardW / 2 + 14, ly - 26, cardW - 28, 52, 8);
            rowBg.lineStyle(1, world.accent, 0.5);
            rowBg.strokeRoundedRect(-cardW / 2 + 14, ly - 26, cardW - 28, 52, 8);
          });
          hitZone.on('pointerup', () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('LevelScene', { level });
            });
          });
        }
      });

      // Subtle glow pulse on entire card
      this.tweens.add({
        targets: topGlow,
        alpha: { from: 0.08, to: 0.18 },
        duration: 1800 + wi * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // ── Back button ────────────────────────────────────────────────────────────
    const backBtn = this.add.text(36, 28, '← BACK', {
      fontSize: '15px', color: '#6688aa', fontFamily: 'Arial, sans-serif',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

    backBtn.on('pointerover', () => backBtn.setColor('#aaccff'));
    backBtn.on('pointerout',  () => backBtn.setColor('#6688aa'));
    backBtn.on('pointerup',   () => {
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
    });

    // ── Entrance animation ────────────────────────────────────────────────────
    this.cameras.main.fadeIn(500);
    this.tweens.add({ targets: titleText, alpha: 1, y: 30, duration: 600, delay: 100, ease: 'Back.easeOut' });
    this.tweens.add({ targets: titleRule, alpha: 1, duration: 400, delay: 400 });
    this.tweens.add({ targets: backBtn,   alpha: 1, duration: 400, delay: 300 });

    cardContainers.forEach((c, i) => {
      this.tweens.add({ targets: c, alpha: 1, y: cardY, duration: 500, delay: 300 + i * 120, ease: 'Back.easeOut' });
    });
  }
}

