// Rescue dive: swim around, free tangled animals, pick up trash and food.
// The HUD and pop-ups live in DiveUIScene so they don't scroll with the camera.

const RESCUE_TIME = 1.6;      // seconds spent next to an animal to free it
const POD_SPACING = 22;       // trail points between each follower
const KNOT_TIME = 1.2;        // seconds to cut one knot on a big animal

// How the big animals look while tangled, and where their knots are (relative to the animal).
const BIG_RESCUES = {
  orca: {
    tex: 'orca', anim: 'orca', scale: 2.4, facing: -1, net: [1.0, 0.55], netY: 0, helpY: 62, cardSize: 240,
    knots: [[-90, -8], [0, 18], [90, -10]],
  },
  bluewhale: {
    tex: 'bluewhale_smile', anim: 'bluewhale_smile', scale: 6, facing: 1, net: [1.5, 1.0], netY: 30, helpY: 100, cardSize: 170,
    knots: [[-140, 20], [-50, 70], [50, 10], [140, 45]],
  },
};

class DiveScene extends Phaser.Scene {
  constructor() { super('Dive'); }

  init(data) {
    this.levelIndex = data.level || 0;
    this.L = LEVELS[this.levelIndex];
  }

  create() {
    const L = this.L;
    this.rnd = new Phaser.Math.RandomDataGenerator([L.key]);
    this.paused = true;
    this.done = false;
    this.surfacing = false;
    this.ui = null;
    this.dark = null;
    this.stats = { rescued: 0, trash: 0, food: 0, foodBy: {}, bottles: 0, shells: 0 };
    this.trail = [];
    this.pod = [];
    this.oxygen = 100;

    this.physics.world.setBounds(0, 0, L.width, L.height);
    this.cameras.main.setBounds(0, 0, L.width, L.height);
    this.cameras.main.fadeIn(500, 2, 21, 38);

    this.buildWorld();
    this.spawnAmbient();
    this.spawnVents();
    this.spawnFood();
    this.spawnTrash();
    this.spawnBottles();
    this.spawnShells();
    this.spawnTangled();
    this.createPlayer();

    this.murk = this.add.rectangle(0, 0, GAME_W, GAME_H, L.murk, L.murkAlpha)
      .setOrigin(0).setScrollFactor(0).setDepth(50);
    if (L.dark) {
      this.dark = this.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0).setScrollFactor(0).setDepth(60);
    }

    this.hearts = this.add.particles(0, 0, 'heart', {
      speed: { min: 60, max: 170 }, lifespan: 1200, scale: { start: 1.5, end: 0.4 },
      alpha: { start: 1, end: 0 }, gravityY: -80, emitting: false,
    }).setDepth(70);
    this.sparkles = this.add.particles(0, 0, 'sparkle', {
      speed: { min: 30, max: 100 }, lifespan: 600, scale: { start: 1.3, end: 0 }, emitting: false,
    }).setDepth(70);

    this.keys = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D');
    this.input.keyboard.on('keydown-ESC', () => this.openPause());

    Sound.music(this, L.music);
    Sound.ambience(this, L.ambience);
    this.events.once('shutdown', () => { Sound.stopMoving(); this.scene.stop('DiveUI'); });
    this.scene.launch('DiveUI', { dive: this });
  }

  // Called by DiveUIScene once its HUD exists.
  onUiReady(ui) {
    this.ui = ui;
    this.refreshHud();
    const L = this.L;
    const air = L.vehicle === 'diver' ? '\nSwim through bubble streams (or up to the surface) to refill your air.' : '';
    modal(ui, {
      image: sc => angieAvatar(sc, 0, 0, 96),
      title: L.name,
      body: `${L.blurb}\n\nSwim with the arrow keys / WASD, or hold the screen.\nStay close to a tangled animal to free it. Grab trash to clear the water (it gets recycled into Sanctuary decorations), and food like krill, crabs and fish for your friends.${air}`,
      width: 640,
      buttons: [{ label: "Let's dive!", fill: 0x7cffb2, onClick: () => this.setPaused(false) }],
    });
  }

  setPaused(on) {
    this.paused = on;
    if (on) this.physics.pause(); else this.physics.resume();
  }

  goTo(key, data) {
    this.setPaused(true);
    this.cameras.main.fadeOut(300, 2, 21, 38);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  // ---------------------------------------------------------------- world

  buildWorld() {
    const L = this.L;
    const W = L.width;
    const H = L.height;
    oceanGradient(this, W, H, L.top, L.bottom);

    // far hills, drawn wide enough for their slower scroll speed
    const far = this.add.graphics().setScrollFactor(0.5, 1).setDepth(2);
    far.fillStyle(L.far, 0.55);
    far.beginPath();
    far.moveTo(0, H);
    const farW = W * 0.5 + GAME_W + 100;
    for (let x = 0; x <= farW; x += 60) far.lineTo(x, H - 150 - Math.sin(x / 210) * 60 - this.rnd.between(0, 30));
    far.lineTo(farW, H);
    far.closePath();
    far.fillPath();

    if (!L.dark) {
      const xs = [];
      for (let x = 100; x < W * 0.3 + GAME_W; x += 260) xs.push(x);
      lightRays(this, xs, 0.3);
      const surface = this.add.graphics().setDepth(9);
      surface.fillStyle(0xffffff, 0.35);
      surface.fillRect(0, 0, W, 6);
    }

    drawSeabed(this, W, H, {
      sand: L.sand, rnd: this.rnd, kelp: L.kelp, coral: L.coral, rocks: L.rocks,
      kelpMax: L.kelp > 20 ? 3.6 : 1.7,
    });

    this.add.particles(0, 0, 'bubble', {
      x: { min: 0, max: GAME_W }, y: GAME_H + 10,
      speedY: { min: -60, max: -25 }, speedX: { min: -8, max: 8 },
      lifespan: 9000, scale: { min: 0.5, max: 1.2 }, alpha: { start: 0.5, end: 0 },
      frequency: 400,
    }).setScrollFactor(0).setDepth(12);
  }

  spawnAmbient() {
    this.ambient = [];
    const L = this.L;
    L.ambient.forEach((kind, i) => {
      const sf = 0.55;
      const range = L.width * sf + GAME_W;
      if (kind === 'bluewhale') {
        const w = this.add.sprite(-200, L.height * 0.42, 'bluewhale').play('bluewhale')
          .setScale(3.2).setAlpha(0.5).setTint(0xa8d8ff).setScrollFactor(sf, 1).setDepth(4);
        this.tweens.add({
          targets: w, x: range + 200, duration: 46000, repeat: -1, repeatDelay: 3000, delay: i * 9000,
          onStart: () => this.time.delayedCall(6000, () => Sound.sfx('sfx_whale_deep', 0.35)),
          onRepeat: () => this.time.delayedCall(6000, () => Sound.sfx('sfx_whale_deep', 0.35)),
        });
      } else if (kind === 'orca') {
        for (let k = 0; k < 2; k++) {
          const o = this.add.sprite(-260 - k * 140, 70 + k * 40, 'orca').play('orca')
            .setScale(1.6).setFlipX(true).setScrollFactor(sf, 1).setDepth(4).setAlpha(0.85);
          this.tweens.add({ targets: o, x: range + 260, duration: 30000, repeat: -1, repeatDelay: 8000, delay: 4000 + k * 400 });
          const spout = this.add.sprite(0, 0, 'spout').setScale(1.5).setScrollFactor(sf, 1).setDepth(4).setVisible(false);
          this.time.addEvent({
            delay: 3200 + k * 900, loop: true,
            callback: () => { if (o.y < 140) spout.setVisible(true).play('spout'); },
          });
          this.ambient.push({ o, spout });
        }
      }
    });
  }

  spawnVents() {
    this.vents = this.L.vents.map((x) => {
      const y = this.L.height - 42;
      this.add.image(x, y + 10, 'vent').setDepth(9).setScale(1.3);
      this.add.particles(x, y, 'bubble', {
        speedY: { min: -170, max: -110 }, speedX: { min: -14, max: 14 },
        lifespan: 2600, scale: { start: 1.6, end: 0.8 }, alpha: { start: 0.9, end: 0 },
        frequency: 70,
      }).setDepth(11);
      txt(this, x, y + 26, 'AIR', 13, '#ffffffaa').setOrigin(0.5).setDepth(11);
      return { x, y };
    });
  }

  // Food for the Sanctuary. Krill, fish and squid swim in little groups;
  // seagrass and crabs sit on the seabed.
  spawnFood() {
    this.food = [];
    const L = this.L;
    const perGroup = { krill: 6, fish: 4, squid: 2, seagrass: 3, crab: 2 };
    Object.entries(L.food).forEach(([type, groups]) => {
      const def = FOODS[type];
      const onFloor = type === 'seagrass' || type === 'crab';
      for (let i = 0; i < groups; i++) {
        const cx = this.rnd.between(250, L.width - 200);
        const cy = onFloor ? L.height - 48 : this.rnd.between(130, L.height - 140);
        for (let k = 0; k < perGroup[type]; k++) {
          const x = cx + this.rnd.between(-40, 40);
          const y = onFloor ? cy - this.rnd.between(0, 6) : cy + this.rnd.between(-24, 24);
          const f = this.add.image(x, y, def.tex).setScale(def.scale).setDepth(20);
          f.foodType = type;
          if (type === 'seagrass') {
            f.setOrigin(0.5, 1);
            this.tweens.add({
              targets: f, angle: { from: -8, to: 8 }, duration: this.rnd.between(1200, 2000),
              yoyo: true, repeat: -1, ease: 'Sine.inOut',
            });
          } else if (type === 'crab') {
            this.tweens.add({
              targets: f, x: x + this.rnd.between(-50, 50), duration: this.rnd.between(1500, 2600),
              yoyo: true, repeat: -1, ease: 'Sine.inOut',
            });
          } else {
            f.setFlipX(this.rnd.frac() > 0.5);
            this.tweens.add({
              targets: f, x: x + this.rnd.between(-30, 30), y: y + this.rnd.between(-16, 16),
              duration: this.rnd.between(900, 1700), yoyo: true, repeat: -1, ease: 'Sine.inOut',
            });
          }
          this.food.push(f);
        }
      }
    });
  }

  spawnTrash() {
    this.trash = [];
    const L = this.L;
    const kinds = ['trash_bottle', 'trash_can', 'trash_bag', 'trash_rings'];
    for (let i = 0; i < L.trash; i++) {
      const onFloor = this.rnd.frac() < 0.35;
      const x = this.rnd.between(220, L.width - 120);
      const y = onFloor ? L.height - 58 : this.rnd.between(110, L.height - 120);
      const t = this.add.image(x, y, this.rnd.pick(kinds)).setScale(1.6).setDepth(20)
        .setAngle(this.rnd.between(-40, 40));
      if (!onFloor) {
        this.tweens.add({
          targets: t, y: y + 10, angle: t.angle + 15, duration: this.rnd.between(1800, 2800),
          yoyo: true, repeat: -1, ease: 'Sine.inOut',
        });
      }
      this.trash.push(t);
    }
  }

  // One bottle per note not yet found in this dive. Extra notes beyond the
  // hand-placed spots get random positions.
  spawnBottles() {
    const L = this.L;
    const left = Save.notesIn(this.levelIndex).length - Save.notesFoundIn(this.levelIndex);
    const spots = L.bottles.slice();
    while (spots.length < left) {
      spots.push({ x: this.rnd.between(200, L.width - 200), y: this.rnd.between(120, L.height - 70) });
    }
    this.bottles = spots.slice(spots.length - left).map((b) => {
      const img = this.add.image(b.x, b.y, 'bottle_msg').setScale(1.8).setAngle(70).setDepth(21);
      this.tweens.add({ targets: img, angle: 62, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return img;
    });
    this.time.addEvent({
      delay: 1500, loop: true,
      callback: () => this.bottles.forEach(b => this.sparkles.explode(3, b.x + 6, b.y - 8)),
    });
  }

  // Pearl shells on the seabed, each holding an ocean fact.
  spawnShells() {
    const L = this.L;
    this.shells = [];
    for (let i = 0; i < (L.shells || 0); i++) {
      const x = this.rnd.between(300, L.width - 150);
      const shell = this.add.image(x, L.height - 56, 'shell').setScale(2).setDepth(21);
      this.add.particles(x, L.height - 66, 'bubble', {
        speedY: { min: -40, max: -20 }, lifespan: 1600, scale: { start: 0.8, end: 0.3 },
        alpha: { start: 0.8, end: 0 }, frequency: 600,
      }).setDepth(21);
      this.shells.push(shell);
    }
  }

  spawnTangled() {
    this.tangled = this.L.rescues.map((r) => {
      const special = r.species === 'whaleshark';
      const big = !!SPECIES[r.species].big;
      let spr;
      let net;
      let knots = null;
      if (big) {
        const b = BIG_RESCUES[r.species];
        spr = this.add.sprite(r.x, r.y, b.tex).play({ key: b.anim, frameRate: 3 }).setScale(b.scale);
        net = this.add.image(r.x, r.y + b.netY, 'bignet').setScale(b.net[0], b.net[1]);
        spr.artFacing = b.facing;
        knots = b.knots.map(([dx, dy]) => {
          const img = this.add.image(r.x + dx, r.y + dy, 'knot').setDepth(27);
          this.tweens.add({ targets: img, scale: 1.25, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          return { x: r.x + dx, y: r.y + dy, img, progress: 0, done: false };
        });
      } else if (special) {
        spr = this.add.sprite(r.x, r.y, 'whaleshark').play({ key: 'whaleshark_swim', frameRate: 2 }).setScale(0.75);
        net = this.add.image(r.x - 6, r.y + 6, 'bignet').setScale(0.95);
        spr.artFacing = -1;
      } else {
        spr = this.add.sprite(r.x, r.y, `${r.species}_hurt`).play(`${r.species}_hurt`).setScale(2);
        net = this.add.image(r.x, r.y, 'net').setScale(1.3);
        spr.artFacing = 1;
      }
      spr.setDepth(25);
      net.setDepth(26);
      const wobble = big ? 2 : 5;
      this.tweens.add({ targets: [spr, net], angle: { from: -wobble, to: wobble }, duration: 300, yoyo: true, repeat: -1 });
      const helpY = big ? BIG_RESCUES[r.species].helpY : special ? 110 : 56;
      const help = txt(this, r.x, r.y - helpY, '!', 34, '#ff6b9a', { stroke: '#ffffff', strokeThickness: 6, fontStyle: '700' })
        .setOrigin(0.5).setDepth(27);
      this.tweens.add({ targets: help, y: help.y - 10, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return {
        spr, net, help, knots, species: r.species, special,
        ring: this.add.graphics().setDepth(27),
        progress: 0,
        need: special ? 4.5 : RESCUE_TIME,
        radius: special ? 175 : 90,
        freed: false,
      };
    });
  }

  createPlayer() {
    const L = this.L;
    let p;
    if (L.vehicle === 'sub') {
      p = this.physics.add.sprite(L.start.x, L.start.y, 'sub');
      p.body.setCircle(30, 30, 7);
      p.artFacing = -1;
      p.speed = 230;
    } else {
      p = this.physics.add.sprite(L.start.x, L.start.y, 'diver_tread').play('diver_tread');
      p.body.setCircle(22, 42, 46);
      p.artFacing = 1;
      p.speed = 250;
    }
    p.setDepth(30).setCollideWorldBounds(true);
    this.player = p;
    this.cameras.main.startFollow(p, true, 0.08, 0.08);
    const tag = txt(this, p.x, p.y - 60, PERSONAL.heroName, 18, '#ffffff', { stroke: '#0b3954', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(31);
    this.time.delayedCall(6000, () => this.tweens.add({ targets: tag, alpha: 0, duration: 800, onComplete: () => tag.destroy() }));
    this.nameTag = tag;
  }

  // ---------------------------------------------------------------- update

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.updateAmbient();
    if (this.dark) this.updateDarkness();
    if (this.paused || this.done || this.surfacing) { Sound.setMoving(0); return; }

    this.updatePlayer();
    this.updateTrail();
    this.updatePod(time);
    this.updatePickups();
    this.updateRescues(dt);
    if (this.L.vehicle === 'diver') this.updateOxygen(dt);
    this.updateArrow();
  }

  updatePlayer() {
    const p = this.player;
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (k.LEFT.isDown || k.A.isDown) dx -= 1;
    if (k.RIGHT.isDown || k.D.isDown) dx += 1;
    if (k.UP.isDown || k.W.isDown) dy -= 1;
    if (k.DOWN.isDown || k.S.isDown) dy += 1;

    const ptr = this.input.activePointer;
    if (dx === 0 && dy === 0 && ptr.isDown && this.ui && !this.ui._uiPointer) {
      const wp = ptr.positionToCamera(this.cameras.main);
      const vx = wp.x - p.x;
      const vy = wp.y - p.y;
      const d = Math.hypot(vx, vy);
      if (d > 24) { dx = vx / d; dy = vy / d; }
    }

    const len = Math.hypot(dx, dy) || 1;
    const v = p.body.velocity;
    v.x = Phaser.Math.Linear(v.x, (dx / len) * p.speed, 0.08);
    v.y = Phaser.Math.Linear(v.y, (dy / len) * p.speed, 0.08);

    if (Math.abs(v.x) > 20) p.setFlipX(p.artFacing === 1 ? v.x < 0 : v.x > 0);
    const facingLeft = p.artFacing === 1 ? p.flipX : !p.flipX;
    const moving = Math.hypot(v.x, v.y) > 60;
    Sound.setMoving(Math.min(1, Math.hypot(v.x, v.y) / p.speed));

    if (p.artFacing === 1) p.play(moving ? 'diver_swim' : 'diver_tread', true);
    const tilt = moving ? Phaser.Math.Clamp(v.y / p.speed, -1, 1) * 0.4 * (facingLeft ? -1 : 1) : 0;
    p.rotation = Phaser.Math.Linear(p.rotation, tilt, 0.1);
    if (this.nameTag.active) this.nameTag.setPosition(p.x, p.y - 60);
  }

  updateTrail() {
    const p = this.player;
    const last = this.trail[this.trail.length - 1];
    if (!last || Phaser.Math.Distance.Between(last.x, last.y, p.x, p.y) > 3) {
      this.trail.push({ x: p.x, y: p.y });
      if (this.trail.length > 600) this.trail.shift();
    }
  }

  updatePod(time) {
    let gap = 0;
    this.pod.forEach((c, i) => {
      gap += c.special ? POD_SPACING * 3 : POD_SPACING;
      const target = this.trail[Math.max(0, this.trail.length - 1 - gap)] || this.player;
      const nx = Phaser.Math.Linear(c.x, target.x, 0.1);
      const ny = Phaser.Math.Linear(c.y, target.y + Math.sin(time / 400 + i) * 6, 0.1);
      if (Math.abs(nx - c.x) > 0.4) c.setFlipX(c.artFacing === 1 ? nx < c.x : nx > c.x);
      c.x = nx;
      c.y = ny;
    });
  }

  updatePickups() {
    const p = this.player;
    const near = (o, r) => Phaser.Math.Distance.Between(o.x, o.y, p.x, p.y) < r;

    this.food = this.food.filter((f) => {
      if (!near(f, 36)) return true;
      this.tweens.killTweensOf(f);
      this.tweens.add({ targets: f, x: p.x, y: p.y, scale: 0, duration: 150, onComplete: () => f.destroy() });
      Sound.sfx('pop');
      this.stats.food++;
      this.stats.foodBy[f.foodType] = (this.stats.foodBy[f.foodType] || 0) + 1;
      Save.addFood(f.foodType);
      Save.store();
      this.refreshHud();
      return false;
    });

    this.trash = this.trash.filter((t) => {
      if (!near(t, 40)) return true;
      this.tweens.killTweensOf(t);
      this.tweens.add({ targets: t, x: p.x, y: p.y, scale: 0, angle: 360, duration: 250, onComplete: () => t.destroy() });
      this.sparkles.explode(5, t.x, t.y);
      Sound.sfx('trash');
      this.stats.trash++;
      Save.data.recycle++;
      Save.store();
      const left = 1 - this.stats.trash / this.L.trash;
      this.tweens.add({ targets: this.murk, alpha: this.L.murkAlpha * left, duration: 400 });
      this.refreshHud();
      if (this.stats.trash === this.L.trash) toast(this.ui, 'All the trash is gone. The water is sparkling!', '#7cffb2');
      return false;
    });

    this.bottles = this.bottles.filter((b) => {
      if (!near(b, 46)) return true;
      this.openBottle(b);
      return false;
    });

    this.shells = this.shells.filter((sh) => {
      if (!near(sh, 40)) return true;
      this.openShell(sh);
      return false;
    });
  }

  openBottle(bottle) {
    bottle.destroy();
    const lvl = this.levelIndex;
    const notes = Save.notesIn(lvl);
    const index = Save.notesFoundIn(lvl);
    if (index >= notes.length) return;
    const note = notes[index];
    Save.data.notesFound[lvl] = index + 1;
    Save.store();
    Sound.sfx('chime');
    this.stats.bottles++;
    this.refreshHud();
    this.setPaused(true);
    modal(this.ui, {
      title: `Message in a bottle (${index + 1} of ${notes.length})`,
      image: (s) => s.add.image(0, 0, 'bottle_msg').setScale(3).setAngle(-20),
      body: `"${note}"\n\n- ${PERSONAL.fromName}`,
      buttons: [{ label: 'Aww ♥', fill: 0xff9ec0, onClick: () => this.setPaused(false) }],
    });
  }

  openShell(shell) {
    this.tweens.add({ targets: shell, scaleY: 0.6, alpha: 0, duration: 300, onComplete: () => shell.destroy() });
    this.sparkles.explode(6, shell.x, shell.y);
    const seen = Save.data.oceanFacts;
    const unseen = OCEAN_FACTS.map((_, i) => i).filter(i => !seen.includes(i));
    const i = unseen.length ? Phaser.Utils.Array.GetRandom(unseen) : Phaser.Math.Between(0, OCEAN_FACTS.length - 1);
    if (!seen.includes(i)) seen.push(i);
    Save.store();
    Sound.sfx('chime');
    this.stats.shells++;
    this.ui.showFact(OCEAN_FACTS[i]);
  }

  updateRescues(dt) {
    const p = this.player;
    this.tangled.forEach((t) => {
      if (t.freed) return;
      if (t.knots) { this.updateKnots(t, dt); return; }
      const d = Phaser.Math.Distance.Between(t.spr.x, t.spr.y, p.x, p.y);
      if (d < t.radius) {
        if (t.progress === 0 && t.special) {
          toast(this.ui, `${PERSONAL.whaleSharkName} the whale shark is caught in a ghost net! Stay close to cut it away.`, '#ffd23f');
        }
        t.progress += dt;
      } else {
        t.progress = Math.max(0, t.progress - dt * 0.5);
      }
      t.ring.clear();
      if (t.progress > 0) {
        const r = t.special ? 120 : 46;
        const frac = Math.min(1, t.progress / t.need);
        t.ring.lineStyle(7, 0xffffff, 0.3).strokeCircle(t.spr.x, t.spr.y, r);
        t.ring.lineStyle(7, 0x7cffb2, 1).beginPath()
          .arc(t.spr.x, t.spr.y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2).strokePath();
      }
      if (t.progress >= t.need) this.freeCreature(t);
    });
  }

  // Big animals are tied up with several knots; each one is cut by staying close to it.
  updateKnots(t, dt) {
    const p = this.player;
    t.ring.clear();
    t.knots.forEach((k) => {
      if (k.done) return;
      if (Phaser.Math.Distance.Between(k.x, k.y, p.x, p.y) < 60) {
        if (!t.warned) {
          t.warned = true;
          Sound.sfx(t.species === 'orca' ? 'sfx_orca' : 'sfx_whale_deep', t.species === 'orca' ? 0.5 : 1);
          toast(this.ui, `This ${SPECIES[t.species].name.toLowerCase()} is tied up in fishing line! Cut all ${t.knots.length} knots to free it.`, '#ffd23f');
        }
        k.progress += dt;
      } else {
        k.progress = Math.max(0, k.progress - dt * 0.5);
      }
      if (k.progress > 0) {
        const frac = Math.min(1, k.progress / KNOT_TIME);
        t.ring.lineStyle(6, 0xffffff, 0.3).strokeCircle(k.x, k.y, 30);
        t.ring.lineStyle(6, 0x7cffb2, 1).beginPath()
          .arc(k.x, k.y, 30, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2).strokePath();
      }
      if (k.progress >= KNOT_TIME) {
        k.done = true;
        this.tweens.killTweensOf(k.img);
        this.tweens.add({ targets: k.img, scale: 0, angle: 180, duration: 300, onComplete: () => k.img.destroy() });
        this.sparkles.explode(8, k.x, k.y);
        Sound.sfx('snip');
        const left = t.knots.filter(o => !o.done).length;
        if (left) toast(this.ui, `Snip! ${left} knot${left > 1 ? 's' : ''} to go.`, '#7cffb2');
      }
    });
    if (t.knots.every(k => k.done)) this.freeBig(t);
  }

  // Big animals don't fit in the Sanctuary: they swim off and visit it later.
  freeBig(t) {
    t.freed = true;
    t.ring.destroy();
    t.help.destroy();
    this.tweens.killTweensOf([t.spr, t.net]);
    t.spr.setAngle(0);
    this.tweens.add({
      targets: t.net, scaleX: t.net.scaleX * 1.6, scaleY: t.net.scaleY * 1.6, alpha: 0, duration: 700,
      onComplete: () => t.net.destroy(),
    });
    this.hearts.explode(36, t.spr.x, t.spr.y);
    Sound.sfx('sfx_ping');
    this.time.delayedCall(500, () => Sound.sfx(t.species === 'orca' ? 'sfx_orca' : 'sfx_whale', t.species === 'orca' ? 0.5 : 1));
    this.cameras.main.flash(250, 255, 255, 255, false);
    this.stats.rescued++;

    const s = Save.data;
    const sp = SPECIES[t.species];
    const b = BIG_RESCUES[t.species];
    s.rescued[t.species] = (s.rescued[t.species] || 0) + 1;
    const name = Save.pickNickname();
    s.friends.push({ name, species: t.species });
    s.factsSeen[t.species] = Math.max(1, s.factsSeen[t.species] || 0);
    Save.store();
    this.refreshHud();
    t.spr.play(b.anim);

    this.setPaused(true);
    modal(this.ui, {
      title: `You freed the ${sp.name.toLowerCase()}! Meet ${name}`,
      image: sc => speciesPicture(sc, 0, 0, t.species, b.cardSize),
      body: `${speciesFact(t.species, 0)}\n\n${name} is too big for the Sanctuary, but will come and visit you there.`,
      width: 660,
      buttons: [{
        label: `Bye ${name}!`, fill: 0x7cffb2,
        onClick: () => {
          this.setPaused(false);
          t.spr.setFlipX(t.spr.artFacing === -1);
          this.tweens.add({
            targets: t.spr, x: t.spr.x + 1600, y: t.spr.y - 200, duration: 6000, ease: 'Sine.in',
            onComplete: () => t.spr.destroy(),
          });
          this.checkComplete();
        },
      }],
    });
  }

  freeCreature(t) {
    t.freed = true;
    t.ring.destroy();
    t.help.destroy();
    this.tweens.killTweensOf([t.spr, t.net]);
    t.spr.setAngle(0);
    this.tweens.add({
      targets: t.net, scale: t.net.scale * 1.7, alpha: 0, angle: 40, duration: 600,
      onComplete: () => t.net.destroy(),
    });
    this.hearts.explode(t.special ? 30 : 14, t.spr.x, t.spr.y);
    Sound.sfx('sfx_ping');
    this.cameras.main.flash(200, 255, 255, 255, false);
    this.stats.rescued++;

    const s = Save.data;
    s.rescued[t.species] = (s.rescued[t.species] || 0) + 1;
    const name = t.special ? PERSONAL.whaleSharkName : Save.pickNickname();
    s.friends.push({ name, species: t.species });
    t.spr.special = t.special;

    if (t.special) {
      s.metWhaleShark = true;
      s.factsSeen.whaleshark = Math.max(1, s.factsSeen.whaleshark || 0);
      t.spr.play('whaleshark_swim');
      this.tweens.add({ targets: t.spr, scale: 0.42, duration: 800 });
      this.pod.unshift(t.spr);
      this.setPaused(true);
      modal(this.ui, {
        title: `You saved ${name}!`,
        image: (sc) => sc.add.sprite(0, 0, 'whaleshark').play('whaleshark_swim').setScale(0.55),
        body: `${speciesFact('whaleshark', 0)}\n\n${name} is free, and wants to swim with you for a while.`,
        width: 640,
        buttons: [{ label: 'Hi ' + name + '!', fill: 0x7cffb2, onClick: () => { this.setPaused(false); this.checkComplete(); } }],
      });
    } else {
      s.inCare.push({ id: s.nextId++, species: t.species, name, health: Phaser.Math.Between(20, 40) });
      t.spr.play(`${t.species}_walk`);
      this.tweens.add({ targets: t.spr, scale: 1.5, duration: 400 });
      this.pod.push(t.spr);
      toast(this.ui, `You freed a ${SPECIES[t.species].name}! Say hi to ${name} ♥`, '#ffd6e6');
      this.checkComplete();
    }
    Save.store();
    this.refreshHud();
  }

  checkComplete() {
    if (this.stats.rescued === this.tangled.length) this.time.delayedCall(1400, () => this.levelComplete());
  }

  updateOxygen(dt) {
    const p = this.player;
    let refill = p.y < 70;
    this.vents.forEach((v) => {
      if (Math.abs(p.x - v.x) < 50 && p.y < v.y && p.y > v.y - 340) refill = true;
    });
    this.oxygen = Phaser.Math.Clamp(this.oxygen + (refill ? 40 : -this.L.oxygenDrain) * dt, 0, 100);
    if (this.ui) this.ui.setAir(this.oxygen, refill);
    if (this.oxygen <= 0) this.outOfAir();
  }

  outOfAir() {
    this.surfacing = true;
    const p = this.player;
    p.body.setVelocity(0, 0);
    Sound.sfx('oops');
    toast(this.ui, `Phew! ${PERSONAL.heroName} swam up for a big breath of air.`, '#9ad8ff');
    this.tweens.add({
      targets: p, y: 50, duration: 1500, ease: 'Sine.inOut',
      onComplete: () => { this.oxygen = 100; this.surfacing = false; },
    });
  }

  updateArrow() {
    if (!this.ui) return;
    const p = this.player;
    let best = null;
    let bestD = Infinity;
    this.tangled.forEach((t) => {
      if (t.freed) return;
      const d = Phaser.Math.Distance.Between(t.spr.x, t.spr.y, p.x, p.y);
      if (d < bestD) { bestD = d; best = t; }
    });
    const cam = this.cameras.main;
    if (!best) { this.ui.setArrow(false); return; }
    const sx = best.spr.x - cam.scrollX;
    const sy = best.spr.y - cam.scrollY;
    if (sx > 0 && sx < GAME_W && sy > 0 && sy < GAME_H) { this.ui.setArrow(false); return; }
    const ang = Math.atan2(sy - GAME_H / 2, sx - GAME_W / 2);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const scale = Math.min((GAME_W / 2 - 46) / Math.abs(cos || 1e-6), (GAME_H / 2 - 46) / Math.abs(sin || 1e-6));
    this.ui.setArrow(true, GAME_W / 2 + cos * scale, GAME_H / 2 + sin * scale, ang);
  }

  updateAmbient() {
    (this.ambient || []).forEach(({ o, spout }) => spout.setPosition(o.x + 52, o.y - 30));
  }

  updateDarkness() {
    const cam = this.cameras.main;
    const p = this.player;
    const rt = this.dark;
    rt.clear();
    rt.fill(0x01030a, 0.9);
    const ahead = (p.artFacing === 1 ? p.flipX : !p.flipX) ? -90 : 90;
    rt.erase('light', p.x - cam.scrollX - 170 + ahead, p.y - cam.scrollY - 170);
    rt.erase('light_small', p.x - cam.scrollX - 55, p.y - cam.scrollY - 55);
    const glow = (o) => rt.erase('light_small', o.x - cam.scrollX - 55, o.y - cam.scrollY - 55);
    this.tangled.forEach((t) => { if (!t.freed) glow(t.spr); });
    this.pod.forEach(glow);
    this.bottles.forEach(glow);
    this.shells.forEach(glow);
  }

  refreshHud() {
    if (this.ui) this.ui.setStats(this.stats, this.L);
  }

  // ---------------------------------------------------------------- menus

  openPause() {
    if (!this.ui || this.paused || this.done) return;
    this.setPaused(true);
    modal(this.ui, {
      title: 'Paused',
      body: 'Animals you have already freed are safe at the Sanctuary.',
      buttons: [
        { label: 'Keep diving', fill: 0x7cffb2, onClick: () => this.setPaused(false) },
        { label: 'Sanctuary', fill: 0x9ad8ff, onClick: () => this.goTo('Sanctuary') },
        { label: 'Menu', onClick: () => this.goTo('Menu') },
      ],
    });
  }

  levelComplete() {
    if (this.done) return;
    this.done = true;
    this.setPaused(true);
    const s = Save.data;
    const i = this.levelIndex;
    const last = i === LEVELS.length - 1;
    const cleaned = this.stats.trash / this.L.trash >= 0.8;
    const notes = Save.notesIn(i).length;
    const allNotes = Save.notesFoundIn(i) >= notes;
    const stars = 1 + (cleaned ? 1 : 0) + (allNotes ? 1 : 0);
    const gathered = FOOD_ORDER.filter(f => this.stats.foodBy[f])
      .map(f => `${this.stats.foodBy[f]} ${FOODS[f].name.toLowerCase()}`).join(', ') || 'none';
    s.stars[i] = Math.max(s.stars[i] || 0, stars);
    s.unlocked = Math.min(LEVELS.length, Math.max(s.unlocked, i + 2));
    if (last) s.finished = true;
    Save.store();
    Sound.sfx('fanfare');

    const buttons = [
      { label: 'Sanctuary', fill: 0x7cffb2, onClick: () => this.goTo('Sanctuary') },
      last
        ? { label: 'The Ending ♥', fill: 0xff9ec0, onClick: () => this.goTo('Ending') }
        : { label: 'Next dive', onClick: () => this.goTo('Dive', { level: i + 1 }) },
      { label: 'Menu', fill: 0x9ad8ff, onClick: () => this.goTo('Menu') },
    ];
    modal(this.ui, {
      title: 'Dive complete!',
      decorate: (items, y) => {
        for (let k = 0; k < 3; k++) {
          const st = this.ui.add.image(GAME_W / 2 + (k - 1) * 56, y + 22, k < stars ? 'star' : 'star_empty').setScale(1.3);
          items.push(st);
        }
        return y + 56;
      },
      body: `Friends rescued: ${this.stats.rescued}\nTrash cleaned: ${this.stats.trash} / ${this.L.trash} (+${this.stats.trash} recycling points)\nFood gathered: ${gathered}\nMessages in bottles: ${Save.notesFoundIn(i)} / ${notes}${allNotes ? ' ♥' : ' (some are still hidden...)'}\nOcean facts discovered: ${this.stats.shells}`,
      width: 640,
      buttons,
    });
  }
}
