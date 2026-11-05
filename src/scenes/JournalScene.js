// Collection book: every species met, its facts, and the bottle messages found.
class JournalScene extends Phaser.Scene {
  constructor() { super('Journal'); }

  create() {
    const s = Save.data;
    this.cameras.main.fadeIn(400, 2, 21, 38);
    oceanGradient(this, GAME_W, GAME_H, '#ffe9c2', '#f5c98c');
    txt(this, GAME_W / 2, 42, `${PERSONAL.heroName}'s Ocean Journal`, 36, '#5a3410', { fontStyle: '700' }).setOrigin(0.5);
    const met = SPECIES_ORDER.filter(k => s.rescued[k]).length;
    txt(this, GAME_W / 2, 80, `Species met: ${met} / ${SPECIES_ORDER.length}   ·   Friends rescued: ${s.friends.length}`, 17, '#7a4a1c').setOrigin(0.5);

    SPECIES_ORDER.forEach((key, i) => {
      const row = i < 4 ? 0 : 1;
      const col = row === 0 ? i : i - 4;
      const perRow = row === 0 ? 4 : 3;
      const x = GAME_W / 2 + (col - (perRow - 1) / 2) * 220;
      const y = 196 + row * 196;
      this.card(key, x, y);
    });

    button(this, 150, GAME_H - 34, 'Back', () => this.go('Menu'), { w: 140, h: 44, size: 18, fill: 0x9ad8ff });
    button(this, GAME_W / 2, GAME_H - 34, `Messages found (${s.bottles.length}/${LEVELS.length})`, () => this.showNotes(), { w: 300, h: 44, size: 18, fill: 0xff9ec0 });
    button(this, GAME_W - 150, GAME_H - 34, 'Sanctuary', () => this.go('Sanctuary'), { w: 160, h: 44, size: 18, fill: 0x7cffb2 });
  }

  go(key) {
    this.cameras.main.fadeOut(300, 2, 21, 38);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key));
  }

  card(key, x, y) {
    const s = Save.data;
    const sp = SPECIES[key];
    const known = !!s.rescued[key];
    const g = this.add.graphics();
    g.fillStyle(0xfff8e7, 1);
    g.fillRoundedRect(x - 100, y - 85, 200, 170, 18);
    g.lineStyle(3, known ? 0xd18a3a : 0xc9a87a, 1);
    g.strokeRoundedRect(x - 100, y - 85, 200, 170, 18);

    const pic = key === 'whaleshark'
      ? this.add.sprite(x, y - 26, 'whaleshark').play('whaleshark_swim').setScale(0.36)
      : this.add.sprite(x, y - 26, `${key}_idle`).play(`${key}_idle`).setScale(2.2);
    if (!known) pic.setTintFill(0x6b5a45).setAlpha(0.6);

    txt(this, x, y + 38, known ? sp.name : '???', 20, '#5a3410').setOrigin(0.5);
    const note = key === 'whaleshark'
      ? (known ? 'Free and visiting the sanctuary' : 'Not met yet')
      : (known ? `Rescued ${s.rescued[key]}  ·  Released ${s.released[key] || 0}` : 'Not met yet');
    txt(this, x, y + 64, note, 13, '#8a5a2a').setOrigin(0.5);

    if (known) {
      const hit = this.add.rectangle(x, y, 200, 170, 0xffffff, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => modal(this, {
        title: sp.name,
        image: () => (key === 'whaleshark'
          ? this.add.sprite(0, 0, 'whaleshark').play('whaleshark_swim').setScale(0.5)
          : this.add.sprite(0, 0, `${key}_idle`).play(`${key}_idle`).setScale(3)),
        body: `${sp.fact}\n\nHow you can help: ${sp.tip}`,
        width: 620,
        buttons: [{ label: 'Close' }],
      }));
    }
  }

  showNotes() {
    const found = Save.data.bottles.slice().sort();
    const body = found.length
      ? found.map(i => `${LEVELS[i].name}\n"${PERSONAL.bottleNotes[i]}"`).join('\n\n') + `\n\n- ${PERSONAL.fromName}`
      : 'A message in a bottle is hidden somewhere in every dive. Keep your eyes peeled for a little green sparkle!';
    modal(this, { title: 'Messages in bottles', body, width: 720, buttons: [{ label: 'Close' }] });
  }
}
