class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    const s = Save.data;
    this.cameras.main.fadeIn(800, 2, 21, 38);
    oceanGradient(this, GAME_W, GAME_H, '#c4f6ff', '#3aa6d6');
    lightRays(this, [100, 300, 520, 740, 900]);
    drawSeabed(this, GAME_W, GAME_H, { sand: 0xf5dca8, kelp: 6, coral: 18, rocks: 3 });

    const bw = this.add.sprite(-200, 300, 'bluewhale_smile').play('bluewhale_smile').setScale(3).setAlpha(0.5).setDepth(2);
    this.tweens.add({ targets: bw, x: GAME_W + 200, duration: 30000, repeat: -1, repeatDelay: 3000 });

    const ws = this.add.sprite(GAME_W / 2, 215, 'whaleshark').play('whaleshark_swim').setScale(0.62).setDepth(20);
    this.tweens.add({ targets: ws, y: 200, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const face = angieAvatar(this, 230, 190, 130).setDepth(21);
    this.tweens.add({ targets: face, y: 178, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    txt(this, 12, GAME_H - 22, 'Angie portrait by @viiolaceus', 13, '#0b3954aa').setDepth(30);

    // the friends still recovering swim around the whale shark
    s.inCare.slice(0, 6).forEach((rec, i) => {
      const a = (i / 6) * Math.PI * 2;
      const c = this.add.sprite(GAME_W / 2 + Math.cos(a) * 250, 215 + Math.sin(a) * 70, `${rec.species}_walk`)
        .play(`${rec.species}_walk`).setScale(1.4).setDepth(19);
      this.tweens.addCounter({
        from: 0, to: Math.PI * 2, duration: 16000, repeat: -1,
        onUpdate: (tw) => {
          const t = a + tw.getValue();
          const nx = GAME_W / 2 + Math.cos(t) * 250;
          c.setFlipX(nx < c.x);
          c.setPosition(nx, 215 + Math.sin(t) * 70);
        },
      });
    });

    this.add.particles(0, 0, 'heart', {
      x: { min: 0, max: GAME_W }, y: GAME_H + 10, speedY: { min: -60, max: -30 }, speedX: { min: -10, max: 10 },
      lifespan: 10000, scale: { min: 1, max: 2 }, alpha: { start: 0.9, end: 0 }, frequency: 350,
    }).setDepth(25);

    txt(this, GAME_W / 2, 52, PERSONAL.endingTitle, 40, '#ffffff', { stroke: '#0b3954', strokeThickness: 8, fontStyle: '700' })
      .setOrigin(0.5).setDepth(30);

    const released = Object.values(s.released).reduce((a, b) => a + b, 0);
    const lines = [
      PERSONAL.endingMessage,
      '',
      `Friends rescued: ${s.friends.length}   ·   Released home: ${released}   ·   Messages found: ${s.bottles.length}/${LEVELS.length}`,
      s.friends.length ? `With love from ${s.friends.map(f => f.name).join(', ')}` : '',
      `- ${PERSONAL.fromName}`,
    ];
    const g = this.add.graphics().setDepth(29);
    const body = txt(this, GAME_W / 2, 304, lines.join('\n'), 17, '#0b3954', {
      align: 'center', wordWrap: { width: 760 }, lineSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(30);
    g.fillStyle(0xffffff, 0.78);
    g.fillRoundedRect(GAME_W / 2 - 400, 292, 800, body.height + 24, 18);

    button(this, GAME_W / 2 - 110, GAME_H - 30, 'Menu', () => this.go('Menu'), { w: 180, h: 44, size: 18, fill: 0x9ad8ff }).setDepth(30);
    button(this, GAME_W / 2 + 110, GAME_H - 30, 'Sanctuary', () => this.go('Sanctuary'), { w: 180, h: 44, size: 18, fill: 0x7cffb2 }).setDepth(30);
  }

  go(key) {
    this.cameras.main.fadeOut(300, 2, 21, 38);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key));
  }
}
