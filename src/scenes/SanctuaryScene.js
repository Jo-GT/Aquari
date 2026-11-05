// Cosy mode: feed and care for rescued animals, then release them home.
// Big rescued animals visit in the background, and trash from dives is
// recycled into decorations for the cove.

const PEN = { x1: 70, x2: 630, y1: 180, y2: 430 };

// Where each decoration sits in the cove.
const DECOR_SPOTS = {
  starfish: { x: 130, y: 516, scale: 1.4 },
  castle: { x: 250, y: 516, scale: 1.7 },
  chest: { x: 370, y: 516, scale: 1.4 },
  anemone: { x: 480, y: 510, scale: 1.2 },
  sign: { x: 600, y: 506, scale: 1 },
};

// Big friends that swim past in the background once rescued.
const VISITORS = {
  whaleshark: { size: 120, facing: -1, y: [200, 250], duration: 26000, delay: 0 },
  orca: { size: 130, facing: -1, y: [175, 215], duration: 20000, delay: 6000 },
  bluewhale: { size: 150, facing: 1, y: [250, 300], duration: 34000, delay: 12000 },
};

class SanctuaryScene extends Phaser.Scene {
  constructor() { super('Sanctuary'); }

  create() {
    this.cameras.main.fadeIn(400, 2, 21, 38);
    Sound.music(this, 'music_sunlit');
    Sound.ambience(this, 'amb_waves');
    this.selected = null;
    this.animals = [];
    this.visitors = [];
    this.shop = null;
    this._toasts = [];
    this._toastBusy = false;

    oceanGradient(this, GAME_W, GAME_H, '#b5f4ff', '#2b9cc6');
    lightRays(this, [120, 340, 560, 780]);
    drawSeabed(this, GAME_W, GAME_H, { sand: 0xf5dca8, kelp: 7, coral: 14, rocks: 4 });

    Object.keys(VISITORS).forEach((key) => { if (Save.data.rescued[key]) this.spawnVisitor(key); });
    Save.data.decor.forEach(key => this.placeDecor(key, false));

    txt(this, 24, 18, `${PERSONAL.heroName}'s Sanctuary`, 34, '#ffffff', { stroke: '#0b3954', strokeThickness: 8, fontStyle: '700' });
    txt(this, 26, 66, 'Feed and care for your rescued friends, then release them home.', 17, '#0b3954');

    button(this, 600, 36, 'Decorate', () => this.openShop(), { w: 140, h: 44, size: 18, fill: 0xffd23f }).setDepth(31);
    button(this, 758, 36, 'Journal', () => this.go('Journal'), { w: 128, h: 44, size: 18, fill: 0x9ad8ff }).setDepth(31);
    button(this, 888, 36, 'Menu', () => this.go('Menu'), { w: 112, h: 44, size: 18 }).setDepth(31);

    this.pantry = this.add.container(0, 0).setDepth(31);
    this.hearts = this.add.particles(0, 0, 'heart', {
      speed: { min: 40, max: 120 }, lifespan: 1100, scale: { start: 1.4, end: 0.4 },
      alpha: { start: 1, end: 0 }, gravityY: -70, emitting: false,
    }).setDepth(60);
    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      speed: { min: 30, max: 120 }, lifespan: 700, scale: { start: 1.4, end: 0 }, emitting: false,
    }).setDepth(60);

    Save.data.inCare.forEach(rec => this.spawnAnimal(rec));
    this.panel = this.add.container(0, 0).setDepth(40);
    this.refreshPanel();
    this.refreshPantry();
    ambientBubbles(this);
  }

  go(key) {
    this.cameras.main.fadeOut(300, 2, 21, 38);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key));
  }

  // ---------------------------------------------------------------- visitors

  visitorName(key) {
    if (key === 'whaleshark') return PERSONAL.whaleSharkName;
    const f = Save.data.friends.filter(fr => fr.species === key).pop();
    return f ? f.name : SPECIES[key].name;
  }

  spawnVisitor(key) {
    const v = VISITORS[key];
    const name = this.visitorName(key);
    const spr = speciesPicture(this, -200, v.y[0], key, v.size).setDepth(5);
    const label = txt(this, 0, 0, name, 16, '#ffffff', { stroke: '#0b3954', strokeThickness: 4 }).setOrigin(0.5).setDepth(5);
    const swim = (toRight) => {
      spr.setFlipX(v.facing === 1 ? !toRight : toRight);
      this.tweens.add({
        targets: spr, x: toRight ? GAME_W + 200 : -200, y: Phaser.Math.Between(v.y[0], v.y[1]),
        duration: v.duration, ease: 'Sine.inOut', onComplete: () => swim(!toRight),
      });
    };
    this.time.delayedCall(v.delay, () => swim(true));
    this.visitors.push({ spr, label });
    spr.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      Sound.sfx({ whaleshark: 'sfx_ping', orca: 'sfx_orca', bluewhale: 'sfx_whale' }[key], key === 'orca' ? 0.5 : 1);
      const { fact, isNew } = Save.revealFact(key);
      modal(this, {
        title: `${name} the ${SPECIES[key].name.toLowerCase()} came to visit!`,
        body: `${isNew ? 'New fact! ' : ''}${fact}\n\nHow you can help: ${SPECIES[key].tip}`,
        width: 640,
        buttons: [{ label: 'Hi ♥' }],
      });
    });
  }

  // ---------------------------------------------------------------- animals in care

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
    this.visitors.forEach(({ spr, label }) => label.setPosition(spr.x, spr.y - spr.displayHeight * 0.32 - 6));
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

  // Food stock and recycling points, under the title.
  refreshPantry() {
    const p = this.pantry;
    p.removeAll(true);
    const slots = [...FOOD_ORDER.map(f => [FOODS[f].tex, Save.foodCount(f), FOODS[f].scale]), ['recycle', Save.data.recycle, 1.6]];
    const w = slots.length * 62 + 10;
    const g = this.add.graphics();
    g.fillStyle(0x0b3954, 0.75).fillRoundedRect(20, 94, w, 38, 14);
    p.add(g);
    slots.forEach(([tex, n, scale], i) => {
      const x = 42 + i * 62;
      p.add(this.add.image(x, 113, tex).setScale(scale));
      p.add(txt(this, x + 16, 113, `${n}`, 18).setOrigin(0, 0.5));
    });
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
        ? 'Tap a friend to look after them.\n\nEveryone has a favourite food. Feed them, give them some love, and they will soon be strong enough to go home.'
        : 'Nobody here right now!\n\nGo on a Rescue Dive to help animals tangled in litter, and they will recover here.';
      p.add(angieAvatar(this, x, 165, 90));
      p.add(txt(this, x, 330, msg, 17, '#d9f3ff', { align: 'center', wordWrap: { width: 214 }, fontStyle: '400', lineSpacing: 4 }).setOrigin(0.5));
      if (!this.animals.length) {
        p.add(button(this, x, 460, 'Rescue Dives', () => this.go('Menu'), { w: 200, h: 46, size: 18 }));
      }
      return;
    }

    const rec = s.rec;
    const sp = SPECIES[rec.species];
    p.add(this.add.sprite(x, 148, `${rec.species}_idle`).play(`${rec.species}_idle`).setScale(2.3));
    p.add(txt(this, x, 210, rec.name, 26, '#ffffff', { fontStyle: '700' }).setOrigin(0.5));
    p.add(txt(this, x, 236, sp.name, 16, '#9ad8ff').setOrigin(0.5));

    const ready = rec.health >= 100;
    p.add(this.add.rectangle(x, 262, 204, 18, 0x021526).setStrokeStyle(2, 0xffffff, 0.6));
    p.add(this.add.rectangle(x - 99, 262, 198 * rec.health / 100, 12, ready ? 0xffd23f : 0x7cffb2).setOrigin(0, 0.5));
    p.add(txt(this, x, 284, ready ? 'Healthy and ready to go home!' : `Recovering... ${rec.health}%`, 15, ready ? '#ffd23f' : '#d9f3ff').setOrigin(0.5));

    const fav = FOODS[sp.favourite];
    p.add(txt(this, x - 6, 310, `Favourite food: ${fav.name.toLowerCase()}`, 14, '#ffd6e6').setOrigin(0.5));
    p.add(this.add.image(x + 92, 310, fav.tex).setScale(fav.scale * 0.8));

    // one tappable slot per food
    FOOD_ORDER.forEach((f, i) => {
      const fx = x - 88 + i * 44;
      const n = Save.foodCount(f);
      const slot = this.add.rectangle(fx, 352, 40, 40, f === sp.favourite ? 0x3a7a5a : 0x163f5c)
        .setStrokeStyle(2, f === sp.favourite ? 0x7cffb2 : 0x7fe3f0, 0.8);
      slot.setInteractive({ useHandCursor: true }).on('pointerup', () => this.feed(s, f, fx, 352));
      p.add([slot, this.add.image(fx, 350, FOODS[f].tex).setScale(FOODS[f].scale).setAlpha(n ? 1 : 0.35)]);
      p.add(txt(this, fx, 384, `${n}`, 13, n ? '#ffffff' : '#ffffff66').setOrigin(0.5));
    });
    p.add(txt(this, x, 408, 'Tap a food to feed', 13, '#d9f3ffaa').setOrigin(0.5));

    p.add(button(this, x - 64, 456, 'Cuddle', () => this.cuddle(s), { w: 96, h: 46, size: 17, fill: 0xff9ec0 }));
    p.add(button(this, x + 50, 456, 'Release', () => this.release(s), { w: 124, h: 46, size: 17 }).setEnabled(ready));
  }

  heal(s, amount) {
    s.rec.health = Math.min(100, s.rec.health + amount);
    Save.store();
    this.updateBar(s);
    this.refreshPanel();
    if (s.rec.health >= 100) this.hearts.explode(10, s.x, s.y - 20);
  }

  floatText(s, message, color) {
    const t = txt(this, s.x, s.y - 40, message, 16, color, { stroke: '#0b3954', strokeThickness: 4 }).setOrigin(0.5).setDepth(61);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, delay: 600, duration: 900, onComplete: () => t.destroy() });
  }

  // Favourite food heals the most; krill is a decent snack for anyone.
  feed(s, type, fromX, fromY) {
    const food = FOODS[type];
    if (Save.foodCount(type) < 1) {
      Sound.sfx('oops');
      toast(this, `No ${food.name.toLowerCase()} left! Gather some on a Rescue Dive.`, '#ffd23f');
      return;
    }
    if (s.rec.health >= 100) { toast(this, `${s.rec.name} is already full and healthy!`); return; }
    Save.addFood(type, -1);
    this.refreshPantry();
    const fav = SPECIES[s.rec.species].favourite === type;
    const amount = fav ? 35 : type === 'krill' ? 15 : 10;
    const k = this.add.image(fromX, fromY, food.tex).setScale(food.scale).setDepth(50);
    this.tweens.add({
      targets: k, x: s.x, y: s.y, duration: 450, ease: 'Sine.in',
      onComplete: () => {
        k.destroy();
        this.hearts.explode(fav ? 10 : 3, s.x, s.y);
        Sound.sfx(fav ? 'yum' : 'pop');
        if (fav) this.floatText(s, 'Yum! Favourite!', '#7cffb2');
        else this.floatText(s, 'Nibble...', '#ffffff');
      },
    });
    this.heal(s, amount);
  }

  cuddle(s) {
    Sound.sfx('pop');
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
    Sound.sfx('sfx_release');
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

  // ---------------------------------------------------------------- decorations

  placeDecor(key, celebrate) {
    if (key === 'lanterns') {
      this.placeLanterns();
      if (celebrate) this.sparkles.explode(20, 540, 120);
      return;
    }
    const spot = DECOR_SPOTS[key];
    const img = this.add.image(spot.x, spot.y, `deco_${key}`).setOrigin(0.5, 1).setScale(spot.scale).setDepth(15);
    if (key === 'sign') {
      txt(this, spot.x, spot.y - 45, `${PERSONAL.heroName}'s Cove`, 13, '#3b2300', { fontStyle: '700' }).setOrigin(0.5).setDepth(16);
    } else if (key === 'chest') {
      this.add.particles(spot.x + 10, spot.y - 42, 'bubble', {
        speedY: { min: -50, max: -25 }, speedX: { min: -6, max: 6 }, lifespan: 2400,
        scale: { start: 1, end: 0.4 }, alpha: { start: 0.8, end: 0 }, frequency: 500,
      }).setDepth(16);
      this.time.addEvent({ delay: 1800, loop: true, callback: () => this.sparkles.explode(2, spot.x, spot.y - 20) });
    } else if (key === 'anemone') {
      const fish = this.add.image(spot.x - 30, spot.y - 34, 'clownfish').setDepth(16);
      this.tweens.add({
        targets: fish, x: spot.x + 30, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.inOut',
        onYoyo: () => fish.setFlipX(true), onRepeat: () => fish.setFlipX(false),
      });
      this.tweens.add({ targets: fish, y: spot.y - 42, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.tweens.add({ targets: img, scaleY: spot.scale * 1.08, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    if (celebrate) {
      this.sparkles.explode(20, spot.x, spot.y - img.displayHeight / 2);
      this.hearts.explode(6, spot.x, spot.y - img.displayHeight / 2);
    }
  }

  // A string of glowing jelly lanterns hanging above the cove.
  placeLanterns() {
    const g = this.add.graphics().setDepth(14);
    g.lineStyle(2, 0xffffff, 0.6);
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push(new Phaser.Math.Vector2(420 + t * 250, 104 + Math.sin(t * Math.PI) * 26));
    }
    g.strokePoints(pts);
    [0.1, 0.3, 0.5, 0.7, 0.9].forEach((t, i) => {
      const p = pts[Math.round(t * 20)];
      const l = this.add.image(p.x, p.y + 14, 'deco_lanterns').setDepth(14).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: l, alpha: 0.55, y: l.y + 3, duration: 1100 + i * 170, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    });
  }

  openShop() {
    if (this.shop) this.shop.destroy();
    const c = this.add.container(0, 0).setDepth(500);
    this.shop = c;
    c.add(this.add.rectangle(0, 0, GAME_W, GAME_H, 0x021526, 0.6).setOrigin(0).setInteractive());
    const bg = this.add.graphics();
    bg.fillStyle(0x0b3954, 0.97).fillRoundedRect(110, 36, 740, 470, 24);
    bg.lineStyle(4, 0x7fe3f0, 1).strokeRoundedRect(110, 36, 740, 470, 24);
    c.add(bg);
    c.add(txt(this, GAME_W / 2, 70, 'Decorate your cove', 30, '#ffffff', { fontStyle: '700' }).setOrigin(0.5));
    c.add(this.add.image(GAME_W / 2 - 150, 108, 'recycle').setScale(1.8));
    c.add(txt(this, GAME_W / 2 - 134, 108, `Recycling points: ${Save.data.recycle}   (1 per piece of trash collected)`, 16, '#d9f3ff')
      .setOrigin(0, 0.5));

    DECOR.forEach((d, i) => {
      const x = GAME_W / 2 + ((i % 3) - 1) * 230;
      const y = 200 + Math.floor(i / 3) * 160;
      const owned = Save.data.decor.includes(d.key);
      const card = this.add.graphics();
      card.fillStyle(owned ? 0x1f5f4a : 0x163f5c, 1).fillRoundedRect(x - 105, y - 66, 210, 142, 16);
      card.lineStyle(2, owned ? 0x7cffb2 : 0x7fe3f0, 0.8).strokeRoundedRect(x - 105, y - 66, 210, 142, 16);
      c.add(card);
      const tex = this.textures.get(`deco_${d.key}`).getSourceImage();
      const sc = Math.min(70 / tex.width, 46 / tex.height, 2.5);
      c.add(this.add.image(x, y - 28, `deco_${d.key}`).setScale(sc));
      c.add(txt(this, x, y + 10, d.name, 16, '#ffffff').setOrigin(0.5));
      const afford = Save.data.recycle >= d.cost;
      c.add(button(this, x, y + 46, owned ? 'Placed ♥' : `Buy · ${d.cost}`, () => this.buyDecor(d), {
        w: 140, h: 38, size: 16, fill: owned ? 0x7cffb2 : 0xffd23f,
      }).setEnabled(!owned && afford));
    });
    c.add(button(this, GAME_W / 2, 470, 'Done', () => { c.destroy(); this.shop = null; }, { w: 160, h: 44, size: 18, fill: 0x9ad8ff }));
  }

  buyDecor(d) {
    const s = Save.data;
    if (s.decor.includes(d.key) || s.recycle < d.cost) return;
    s.recycle -= d.cost;
    s.decor.push(d.key);
    Save.store();
    this.refreshPantry();
    this.shop.destroy();
    this.shop = null;
    this.placeDecor(d.key, true);
    Sound.sfx('chime');
    toast(this, `${d.name} added to your cove!`, '#7cffb2');
  }
}
