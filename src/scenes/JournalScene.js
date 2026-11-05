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

    const firstRow = Math.ceil(SPECIES_ORDER.length / 2);
    SPECIES_ORDER.forEach((key, i) => {
      const row = i < firstRow ? 0 : 1;
      const col = row === 0 ? i : i - firstRow;
      const perRow = row === 0 ? firstRow : SPECIES_ORDER.length - firstRow;
      const x = GAME_W / 2 + (col - (perRow - 1) / 2) * 182;
      const y = 192 + row * 174;
      this.card(key, x, y);
    });

    const opts = { h: 44, size: 18 };
    button(this, 90, GAME_H - 34, 'Back', () => this.go('Menu'), { ...opts, w: 130, fill: 0x9ad8ff });
    button(this, 320, GAME_H - 34, `Messages (${Save.notesFoundTotal()}/${Save.notesTotal()})`, () => this.showNotes(), { ...opts, w: 290, fill: 0xff9ec0 });
    button(this, 620, GAME_H - 34, `Ocean facts (${s.oceanFacts.length}/${OCEAN_FACTS.length})`, () => this.showOceanFacts(), { ...opts, w: 270, fill: 0xffd23f });
    button(this, 865, GAME_H - 34, 'Sanctuary', () => this.go('Sanctuary'), { ...opts, w: 170, fill: 0x7cffb2 });
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
    g.fillRoundedRect(x - 86, y - 80, 172, 160, 18);
    g.lineStyle(3, known ? 0xd18a3a : 0xc9a87a, 1);
    g.strokeRoundedRect(x - 86, y - 80, 172, 160, 18);

    const size = { whaleshark: 110, orca: 130, bluewhale: 110 }[key] || 96;
    const pic = speciesPicture(this, x, y - 28, key, size);
    if (!known) pic.setTintFill(0x6b5a45).setAlpha(0.6);

    txt(this, x, y + 32, known ? sp.name : '???', 18, '#5a3410').setOrigin(0.5);
    let note = 'Not met yet';
    if (known) note = sp.visitor ? 'Visits the Sanctuary' : `Rescued ${s.rescued[key]} · Released ${s.released[key] || 0}`;
    txt(this, x, y + 52, note, 12, '#8a5a2a').setOrigin(0.5);
    if (known) txt(this, x, y + 68, `Facts found: ${this.factsKnown(key)} / ${sp.facts.length}`, 12, '#d1588a').setOrigin(0.5);

    if (known) {
      const hit = this.add.rectangle(x, y, 172, 160, 0xffffff, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => pagedModal(this, this.factPages(key)));
    }
  }

  // Facts are revealed one at a time by releasing animals; meeting one shows the first.
  factsKnown(key) {
    return Math.min(SPECIES[key].facts.length, Math.max(1, Save.data.factsSeen[key] || 0));
  }

  // Two facts per page so long fact lists never run off the screen.
  factPages(key) {
    const sp = SPECIES[key];
    const n = this.factsKnown(key);
    const left = sp.facts.length - n;
    const how = sp.visitor ? 'tap them when they visit the Sanctuary' : `release more ${sp.name.toLowerCase()} friends`;
    const known = sp.facts.slice(0, n);
    const pages = [];
    for (let i = 0; i < known.length; i += 2) {
      pages.push({ title: sp.name, body: known.slice(i, i + 2).map(f => `• ${f}`).join('\n\n') });
    }
    pages[pages.length - 1].body += (left ? `\n\n(${left} more to discover: ${how}!)` : '')
      + `\n\nHow you can help: ${sp.tip}`;
    return pages;
  }

  showNotes() {
    const pages = [];
    LEVELS.forEach((L, i) => {
      const found = Save.notesIn(i).slice(0, Save.notesFoundIn(i));
      if (!found.length) return;
      pages.push({
        title: L.name,
        body: found.map(n => `"${n}"`).join('\n\n') + `\n\n- ${PERSONAL.fromName}`,
      });
    });
    if (!pages.length) {
      pages.push({
        title: 'Messages in bottles',
        body: 'Messages in bottles are hidden all over every dive. Keep your eyes peeled for a little green sparkle!',
      });
    }
    pagedModal(this, pages);
  }

  showOceanFacts() {
    const found = Save.data.oceanFacts.slice().sort((a, b) => a - b).map(i => OCEAN_FACTS[i]);
    const pages = [];
    for (let i = 0; i < found.length; i += 4) {
      pages.push({ title: 'Ocean facts', body: found.slice(i, i + 4).map(f => `• ${f}`).join('\n\n') });
    }
    if (!pages.length) {
      pages.push({ title: 'Ocean facts', body: 'Pink pearl shells are hiding on the seabed in every dive. Swim over one to discover an ocean fact!' });
    }
    pagedModal(this, pages);
  }
}
