class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const s = Save.data;
    this.cameras.main.fadeIn(400, 2, 21, 38);
    Sound.music(this, 'music_menu');
    Sound.ambience(this, 'amb_waves');
    Sound.stopMoving();
    oceanGradient(this, GAME_W, GAME_H, '#a6f0ff', '#1876a8');
    lightRays(this, [140, 380, 600, 820]);

    const bw = this.add.sprite(-200, 360, 'bluewhale_smile').play('bluewhale_smile')
      .setScale(3).setAlpha(0.4).setTint(0x9fd8ff).setDepth(2);
    this.tweens.add({ targets: bw, x: GAME_W + 200, duration: 40000, repeat: -1, repeatDelay: 5000 });

    drawSeabed(this, GAME_W, GAME_H, { sand: 0xf2d39b, kelp: 5, coral: 9, rocks: 3 });

    const ws = this.add.sprite(720, 285, 'whaleshark').play('whaleshark_swim').setScale(0.85).setDepth(20);
    this.tweens.add({ targets: ws, y: 268, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const face = angieAvatar(this, 862, 430, 120).setDepth(25);
    this.tweens.add({ targets: face, y: 420, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    txt(this, 250, 92, 'Aquari', 96, '#ffffff', { stroke: '#0b3954', strokeThickness: 12, fontStyle: '700' })
      .setOrigin(0.5).setDepth(30);
    txt(this, 250, 160, `${PERSONAL.heroName}'s Ocean Rescue`, 27, '#fff3b0', { stroke: '#0b3954', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(30);

    const btns = [
      ['Rescue Dives', () => this.openLevels(), 0xffb84d],
      [`Sanctuary${s.inCare.length ? ` (${s.inCare.length})` : ''}`, () => this.go('Sanctuary'), 0x7cffb2],
      ['Ocean Journal', () => this.go('Journal'), 0x9ad8ff],
    ];
    if (s.finished) btns.push(['The Ending ♥', () => this.go('Ending'), 0xff9ec0]);
    btns.forEach(([label, fn, fill], i) => {
      button(this, 250, 232 + i * 66, label, fn, { fill, w: 250 }).setDepth(30);
    });

    txt(this, 14, GAME_H - 30, 'Reset progress', 15, '#0b3954aa')
      .setDepth(30).setInteractive({ useHandCursor: true })
      .on('pointerup', () => modal(this, {
        title: 'Start over?',
        body: 'This clears every rescue, star, food, decoration and message found.',
        buttons: [
          { label: 'Keep playing' },
          { label: 'Reset', fill: 0xff8a8a, onClick: () => { Save.reset(); this.scene.restart(); } },
        ],
      }));

    const mute = button(this, GAME_W - 80, 34, Sound.isMuted() ? 'Sound: off' : 'Sound: on', () => {
      mute.label.setText(Sound.toggleMute() ? 'Sound: off' : 'Sound: on');
    }, { w: 140, h: 42, size: 17, fill: 0x9ad8ff }).setDepth(30);

    this.factBanner();
    ambientBubbles(this);
  }

  // Rotating "Did you know?" ocean fact along the bottom of the menu.
  factBanner() {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x0b3954, 0.7).fillRoundedRect(150, 492, 610, 40, 14);
    this.add.image(176, 512, 'shell').setScale(1.4).setDepth(31);
    const t = txt(this, 200, 512, '', 15, '#fff8e7', { fontStyle: '400', wordWrap: { width: 548 } })
      .setOrigin(0, 0.5).setDepth(31);
    const order = Phaser.Utils.Array.Shuffle(OCEAN_FACTS.slice());
    let i = 0;
    const show = () => {
      t.setText(`Did you know? ${order[i++ % order.length]}`);
      t.setFontSize(t.height > 24 ? 13 : 15);
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 400 });
    };
    show();
    this.time.addEvent({ delay: 9000, loop: true, callback: show });
  }

  go(key, data) {
    this.cameras.main.fadeOut(300, 2, 21, 38);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  openLevels() {
    const s = Save.data;
    const c = this.add.container(0, 0).setDepth(500);
    c.add(this.add.rectangle(0, 0, GAME_W, GAME_H, 0x021526, 0.65).setOrigin(0).setInteractive());
    c.add(txt(this, GAME_W / 2, 58, 'Choose a dive', 40, '#ffffff', { stroke: '#0b3954', strokeThickness: 8 }).setOrigin(0.5));

    LEVELS.forEach((L, i) => {
      const x = GAME_W / 2 + (i - (LEVELS.length - 1) / 2) * 182;
      const y = 270;
      const locked = i >= s.unlocked;
      const card = this.add.graphics();
      card.fillStyle(Phaser.Display.Color.HexStringToColor(L.top).color, 1);
      card.fillRoundedRect(x - 85, y - 140, 170, 280, 20);
      card.fillStyle(Phaser.Display.Color.HexStringToColor(L.bottom).color, 0.85);
      card.fillRoundedRect(x - 85, y - 10, 170, 150, { tl: 0, tr: 0, bl: 20, br: 20 });
      card.lineStyle(4, 0xffffff, 0.9);
      card.strokeRoundedRect(x - 85, y - 140, 170, 280, 20);
      c.add(card);

      const icon = L.vehicle === 'sub'
        ? this.add.image(x, y - 75, 'sub').setScale(0.85)
        : this.add.sprite(x, y - 70, 'diver_swim').play('diver_swim').setScale(1.1);
      c.add(icon);
      c.add(txt(this, x, y - 2, `Dive ${i + 1}`, 16, '#ffffffcc').setOrigin(0.5));
      c.add(txt(this, x, y + 14, L.name, 19, '#ffffff', { align: 'center', wordWrap: { width: 150 }, lineSpacing: -4 }).setOrigin(0.5, 0));
      const stars = s.stars[i] || 0;
      for (let k = 0; k < 3; k++) {
        c.add(this.add.image(x + (k - 1) * 40, y + 78, k < stars ? 'star' : 'star_empty'));
      }
      c.add(txt(this, x, y + 113, `${L.rescues.length} friends to rescue`, 14, '#ffffffcc').setOrigin(0.5));

      if (locked) {
        icon.setTint(0x334455);
        c.add(this.add.rectangle(x, y, 170, 280, 0x021526, 0.55));
        c.add(txt(this, x, y - 10, 'Locked', 24, '#ffffff').setOrigin(0.5));
      } else {
        const hit = this.add.rectangle(x, y, 170, 280, 0xffffff, 0).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => card.setAlpha(0.85));
        hit.on('pointerout', () => card.setAlpha(1));
        hit.on('pointerup', () => this.go('Dive', { level: i }));
        c.add(hit);
      }
    });

    c.add(button(this, GAME_W / 2, 478, 'Back', () => c.destroy(), { w: 160, h: 48, size: 20, fill: 0x9ad8ff }));
    c.add(txt(this, GAME_W / 2, 434, '★ finish the dive   ★ clean up most of the trash   ★ find all the messages in bottles', 14, '#d9f3ff').setOrigin(0.5));
  }
}
