// Cosy mode: feed and care for rescued animals, then release them home.

const PEN = { x1: 70, x2: 630, y1: 170, y2: 430 };

class SanctuaryScene extends Phaser.Scene {
  constructor() { super('Sanctuary'); }

  create() {
    this.cameras.main.fadeIn(400, 2, 21, 38);
    this.selected = null;
    this.animals = [];
    this.visitor = null;
    this._toasts = [];
    this._toastBusy = false;

    oceanGradient(this, GAME_W, GAME_H, '#b5f4ff', '#2b9cc6');
    lightRays(this, [120, 340, 560, 780]);
    drawSeabed(this, GAME_W, GAME_H, { sand: 0xf5dca8, kelp: 7, coral: 14, rocks: 4 });

    if (Save.data.metWhaleShark) this.spawnWhaleShark();

    txt(this, 24, 18, `${PERSONAL.heroName}'s Sanctuary`, 34, '#ffffff', { stroke: '#0b3954', strokeThickness: 8, fontStyle: '700' });
    txt(this, 26, 66, 'Feed and care for your rescued friends, then release them home.', 17, '#0b3954');

    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0x0b3954, 0.75);
    g.fillRoundedRect(GAME_W - 400, 14, 120, 44, 14);
    this.add.image(GAME_W - 374, 36, 'krill').setScale(2.2).setDepth(31);
    this.krillText = txt(this, GAME_W - 354, 36, '', 21).setOrigin(0, 0.5).setDepth(31);
    button(this, GAME_W - 202, 36, 'Journal', () => this.go('Journal'), { w: 128, h: 44, size: 18, fill: 0x9ad8ff }).setDepth(31);
    button(this, GAME_W - 72, 36, 'Menu', () => this.go('Menu'), { w: 112, h: 44, size: 18 }).setDepth(31);

    this.hearts = this.add.particles(0, 0, 'heart', {
      speed: { min: 40, max: 120 }, lifespan: 1100, scale: { start: 1.4, end: 0.4 },
      alpha: { start: 1, end: 0 }, gravityY: -70, emitting: false,
    }).setDepth(60);

    Save.data.inCare.forEach(rec => this.spawnAnimal(rec));
    this.panel = this.add.container(0, 0).setDepth(40);
    this.refreshPanel();
    this.refreshKrill();
    ambientBubbles(this);
  }

  go(key) {
    this.cameras.main.fadeOut(300, 2, 21, 38);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key));
  }

  spawnWhaleShark() {
    const ws = this.add.sprite(-160, 140, 'whaleshark').play('whaleshark_swim').setScale(0.42).setDepth(5).setFlipX(true);
    const label = txt(this, 0, 0, PERSONAL.whaleSharkName, 16, '#ffffff', { stroke: '#0b3954', strokeThickness: 4 }).setOrigin(0.5).setDepth(5);
    const swim = (toRight) => {
      ws.setFlipX(toRight);
      this.tweens.add({
        targets: ws, x: toRight ? GAME_W + 160 : -160, y: Phaser.Math.Between(120, 200),
        duration: 26000, ease: 'Sine.inOut', onComplete: () => swim(!toRight),
      });
    };
    swim(true);
    this.visitor = { ws, label };
    ws.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      const { fact, isNew } = Save.revealFact('whaleshark');
      modal(this, {
        title: `${PERSONAL.whaleSharkName} came to visit!`,
        body: `${isNew ? 'New fact! ' : ''}${fact}\n\nHow you can help: ${SPECIES.whaleshark.tip}`,
        width: 620,
        buttons: [{ label: 'Hi ♥' }],
      });
    });
  }

  spawnAnimal(rec) {
    const s = this.add.sprite(
      Phaser.Math.Between(PEN.x1, PEN.x2), Phaser.Math.Between(PEN.y1, PEN.y2), `${rec.species}_idle`,
    ).play(`${rec.species}_idle`).setScale(2).setDepth(20);
    s.rec = rec;
    s.label = txt(this, 0, 0, rec.name, 15, '#ffffff', { stroke: '#0b3954', strokeThickness: 4 }).setOrigin(0.5).setDepth(21);
    s.barBg = this.add.rectangle(0, 0, 52, 7, 0x0b3954).setDepth(21);
    s.bar = this.add.rectangle(0, 0, 48, 4, 0x7cffb2).setOrigin(0, 0.5).setDepth(22);
    s.setInteractive({ useHandCursor: true }).on('pointerup', () => this.select(s));
    this.animals.push(s);
    this.updateBar(s);
    this.wander(s);
  }

  wander(s) {
    if (!s.active) return;
    const sp = s.rec.species;
    const tx = Phaser.Math.Between(PEN.x1, PEN.x2);
    const ty = Phaser.Math.Between(PEN.y1, PEN.y2);
    s.setFlipX(tx < s.x);
    s.play(`${sp}_walk`, true);
    const d = Phaser.Math.Distance.Between(s.x, s.y, tx, ty);
    this.tweens.add({
      targets: s, x: tx, y: ty, duration: d * 22 + 500, ease: 'Sine.inOut',
      onComplete: () => {
        s.play(`${sp}_idle`, true);
        s.wanderTimer = this.time.delayedCall(Phaser.Math.Between(700, 3000), () => this.wander(s));
      },
    });
  }

  update() {
    if (this.visitor) this.visitor.label.setPosition(this.visitor.ws.x, this.visitor.ws.y - 60);
    this.animals.forEach((s) => {
      s.label.setPosition(s.x, s.y + 38);
      s.barBg.setPosition(s.x, s.y + 54);
      s.bar.setPosition(s.x - 24, s.y + 54);
    });
  }

  updateBar(s) {
    const h = s.rec.health;
    s.bar.width = 48 * h / 100;
    s.bar.fillColor = h >= 100 ? 0xffd23f : 0x7cffb2;
  }

  refreshKrill() {
    this.krillText.setText(`${Save.data.krill}`);
  }

  select(s) {
    this.selected = s;
    this.refreshPanel();
  }

  refreshPanel() {
    const p = this.panel;
    p.removeAll(true);
    const x = GAME_W - 145;
    const bg = this.add.graphics();
    bg.fillStyle(0x0b3954, 0.88);
    bg.fillRoundedRect(x - 125, 92, 250, 410, 22);
    bg.lineStyle(3, 0x7fe3f0, 1);
    bg.strokeRoundedRect(x - 125, 92, 250, 410, 22);
    p.add(bg);

    const s = this.selected;
    if (!s || !s.active) {
      const msg = this.animals.length
        ? 'Tap a friend to look after them.\n\nFeed them krill and give them some love until they are strong enough to go home.'
        : 'Nobody here right now!\n\nGo on a Rescue Dive to help animals tangled in litter, and they will recover here.';
      p.add(angieAvatar(this, x, 165, 90));
      p.add(txt(this, x, 320, msg, 18, '#d9f3ff', { align: 'center', wordWrap: { width: 210 }, fontStyle: '400', lineSpacing: 4 }).setOrigin(0.5));
      if (!this.animals.length) {
        p.add(button(this, x, 450, 'Rescue Dives', () => this.go('Menu'), { w: 200, h: 46, size: 18 }));
      }
      return;
    }

    const rec = s.rec;
    const sp = SPECIES[rec.species];
    p.add(this.add.sprite(x, 160, `${rec.species}_idle`).play(`${rec.species}_idle`).setScale(3));
    p.add(txt(this, x, 222, rec.name, 28, '#ffffff', { fontStyle: '700' }).setOrigin(0.5));
    p.add(txt(this, x, 252, sp.name, 17, '#9ad8ff').setOrigin(0.5));

    const ready = rec.health >= 100;
    p.add(this.add.rectangle(x, 286, 204, 20, 0x021526).setStrokeStyle(2, 0xffffff, 0.6));
    p.add(this.add.rectangle(x - 99, 286, 198 * rec.health / 100, 14, ready ? 0xffd23f : 0x7cffb2).setOrigin(0, 0.5));
    p.add(txt(this, x, 312, ready ? 'Healthy and ready to go home!' : `Recovering... ${rec.health}%`, 15, ready ? '#ffd23f' : '#d9f3ff').setOrigin(0.5));

    p.add(button(this, x - 56, 352, 'Feed', () => this.feed(s), { w: 104, h: 44, size: 18, fill: 0x7cffb2 }));
    p.add(button(this, x + 56, 352, 'Cuddle', () => this.cuddle(s), { w: 104, h: 44, size: 18, fill: 0xff9ec0 }));
    p.add(txt(this, x - 56, 382, '1 krill', 13, '#d9f3ffaa').setOrigin(0.5));
    p.add(button(this, x, 430, 'Release home', () => this.release(s), { w: 214, h: 50, size: 20 }).setEnabled(ready));
    if (!ready) p.add(txt(this, x, 470, 'Get them to 100% first', 13, '#d9f3ffaa').setOrigin(0.5));
  }

  heal(s, amount) {
    s.rec.health = Math.min(100, s.rec.health + amount);
    Save.store();
    this.updateBar(s);
    this.refreshPanel();
    if (s.rec.health >= 100) this.hearts.explode(10, s.x, s.y - 20);
  }

  feed(s) {
    if (Save.data.krill < 1) {
      toast(this, 'No krill left! Scoop some up on a Rescue Dive.', '#ffd23f');
      return;
    }
    if (s.rec.health >= 100) { toast(this, `${s.rec.name} is already full and healthy!`); return; }
    Save.data.krill--;
    this.refreshKrill();
    const k = this.add.image(GAME_W - 374, 36, 'krill').setScale(2.2).setDepth(50);
    this.tweens.add({
      targets: k, x: s.x, y: s.y, duration: 450, ease: 'Sine.in',
      onComplete: () => { k.destroy(); this.hearts.explode(4, s.x, s.y); },
    });
    this.heal(s, 20);
  }

  cuddle(s) {
    this.hearts.explode(6, s.x, s.y - 10);
    this.tweens.add({ targets: s, scaleY: 1.7, scaleX: 2.3, duration: 120, yoyo: true });
    if (s.rec.health < 100) this.heal(s, 4);
  }

  release(s) {
    const rec = s.rec;
    const sp = SPECIES[rec.species];
    const data = Save.data;
    data.inCare = data.inCare.filter(r => r.id !== rec.id);
    data.released[rec.species] = (data.released[rec.species] || 0) + 1;
    Save.store();

    this.selected = null;
    this.animals = this.animals.filter(a => a !== s);
    this.refreshPanel();
    this.tweens.killTweensOf(s);
    if (s.wanderTimer) s.wanderTimer.remove();
    s.disableInteractive();
    [s.label, s.bar, s.barBg].forEach(o => o.destroy());
    s.setFlipX(false).play(`${rec.species}_walk`);
    this.hearts.explode(16, s.x, s.y);
    this.tweens.add({ targets: s, x: GAME_W + 80, y: s.y - 140, duration: 2200, ease: 'Sine.in', onComplete: () => s.destroy() });

    const { fact, isNew } = Save.revealFact(rec.species);
    this.time.delayedCall(900, () => modal(this, {
      title: `${rec.name} is going home!`,
      image: sc => sc.add.sprite(0, 0, `${rec.species}_walk`).play(`${rec.species}_walk`).setScale(3),
      body: `${isNew ? 'New fact unlocked! ' : ''}${fact}\n\nHow you can help: ${sp.tip}`,
      width: 620,
      buttons: [{ label: `Bye ${rec.name}!`, fill: 0x7cffb2 }],
    }));
  }
}
