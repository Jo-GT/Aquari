// Shared UI pieces (text, buttons, pop-ups) and scenery builders.

const FONT = 'Fredoka, "Trebuchet MS", sans-serif';
const GAME_W = 960;
const GAME_H = 540;

function txt(scene, x, y, str, size = 20, color = '#ffffff', extra = {}) {
  const style = Object.assign({
    fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: '600', resolution: 2,
  }, extra);
  const t = scene.add.text(x, y, str, style);
  t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return t;
}

function button(scene, x, y, label, onClick, opts = {}) {
  const { w = 220, h = 54, fill = 0xffb84d, color = '#4a2600', size = 22 } = opts;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const r = h / 2.4;
  g.fillStyle(0x000000, 0.22); g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, r);
  g.fillStyle(fill, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.fillStyle(0xffffff, 0.25); g.fillRoundedRect(-w / 2 + 10, -h / 2 + 5, w - 20, h * 0.3, h * 0.15);
  const t = txt(scene, 0, 0, label, size, color).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.enabled = true;
  c.label = t;
  c.on('pointerover', () => { if (c.enabled) scene.tweens.add({ targets: c, scale: 1.05, duration: 100 }); });
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 100 }));
  c.on('pointerdown', () => { scene._uiPointer = true; if (c.enabled) c.setScale(0.96); });
  c.on('pointerup', () => {
    if (!c.enabled) return;
    c.setScale(1.05);
    onClick();
  });
  c.setEnabled = (on) => { c.enabled = on; c.setAlpha(on ? 1 : 0.45); return c; };
  return c;
}

// Centered pop-up. `image` is a function returning a game object to show on top.
// `decorate(container, y)` can add extra rows and must return the new y.
function modal(scene, { title, body = '', buttons = [{ label: 'OK' }], width = 580, image = null, decorate = null, onClose = null }) {
  const c = scene.add.container(0, 0).setDepth(1000);
  c.add(scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x021526, 0.6).setOrigin(0).setInteractive());
  const bg = scene.add.graphics();
  c.add(bg);
  const cx = GAME_W / 2;
  const items = [];
  let y = 26;

  if (image) {
    const im = image(scene);
    im.setPosition(cx, y + im.displayHeight / 2);
    items.push(im);
    y += im.displayHeight + 8;
  }
  const tt = txt(scene, cx, y, title, 30, '#ffffff', { align: 'center', wordWrap: { width: width - 60 } }).setOrigin(0.5, 0);
  items.push(tt);
  y += tt.height + 10;
  if (decorate) y = decorate(items, y);
  if (body) {
    const bt = txt(scene, cx, y, body, 19, '#d9f3ff', {
      align: 'center', wordWrap: { width: width - 70 }, lineSpacing: 6, fontStyle: '400',
    }).setOrigin(0.5, 0);
    items.push(bt);
    y += bt.height + 20;
  }

  const close = () => {
    if (!c.active) return;
    c.destroy();
    if (onClose) onClose();
  };
  if (buttons.length) {
    const bw = Math.min(200, (width - 40) / buttons.length - 14);
    buttons.forEach((b, i) => {
      const bx = cx + (i - (buttons.length - 1) / 2) * (bw + 14);
      items.push(button(scene, bx, y + 27, b.label, () => {
        close();
        if (b.onClick) b.onClick();
      }, { w: bw, h: 50, size: 19, fill: b.fill || 0xffb84d }));
    });
    y += 54 + 22;
  }

  const top = Math.max(8, (GAME_H - y) / 2);
  items.forEach((it) => { it.y += top; });
  bg.fillStyle(0x0b3954, 0.97);
  bg.fillRoundedRect(cx - width / 2, top, width, y, 24);
  bg.lineStyle(4, 0x7fe3f0, 1);
  bg.strokeRoundedRect(cx - width / 2, top, width, y, 24);
  c.add(items);

  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 180 });
  c.close = close;
  return c;
}

function toast(scene, message, color = '#ffffff') {
  scene._toasts = scene._toasts || [];
  scene._toasts.push({ message, color });
  if (scene._toastBusy) return;
  const next = () => {
    const item = scene._toasts.shift();
    if (!item || !scene.sys.isActive()) { scene._toastBusy = false; return; }
    scene._toastBusy = true;
    const t = txt(scene, GAME_W / 2, 92, item.message, 21, item.color, {
      backgroundColor: '#0b3954dd', padding: { x: 16, y: 8 }, align: 'center', wordWrap: { width: 640 },
    }).setOrigin(0.5).setDepth(900).setAlpha(0);
    scene.tweens.chain({
      targets: t,
      tweens: [
        { alpha: 1, y: 82, duration: 220 },
        { alpha: 1, duration: 2200 },
        { alpha: 0, duration: 300 },
      ],
      onComplete: () => { t.destroy(); next(); },
    });
  };
  next();
}

function oceanGradient(scene, w, h, top, bottom) {
  const key = `grad_${top}_${bottom}_${h}`;
  if (!scene.textures.exists(key)) {
    canvasTexture(scene, key, 2, h, (ctx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2, h);
    });
  }
  return scene.add.image(0, 0, key).setOrigin(0).setDisplaySize(w, h).setDepth(0);
}

function lightRays(scene, xs, scrollX = 1) {
  xs.forEach((x, i) => {
    const r = scene.add.image(x, 0, 'ray').setOrigin(0.5, 0).setAngle(14).setDepth(3)
      .setScrollFactor(scrollX, 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.4);
    scene.tweens.add({ targets: r, alpha: 0.9, duration: 2600 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });
}

function drawSeabed(scene, W, H, o) {
  const rnd = o.rnd || Phaser.Math.RND;
  for (let i = 0; i < (o.kelp || 0); i++) {
    const k = scene.add.image(rnd.between(20, W - 20), H - 26, 'kelp').setOrigin(0.5, 1).setDepth(7)
      .setScale(rnd.realInRange(0.9, o.kelpMax || 1.7));
    scene.tweens.add({
      targets: k, angle: { from: -4, to: 4 }, duration: rnd.between(1800, 3200),
      yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd.between(0, 1500),
    });
  }
  const g = scene.add.graphics().setDepth(8);
  g.fillStyle(o.sand, 1);
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W + 40; x += 40) g.lineTo(x, H - 44 - Math.sin(x / 170) * 9 - rnd.between(0, 5));
  g.lineTo(W + 40, H);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x000000, 0.08);
  for (let i = 0; i < W / 12; i++) g.fillRect(rnd.between(0, W), rnd.between(H - 34, H - 4), 3, 2);
  for (let i = 0; i < (o.rocks || 0); i++) {
    scene.add.image(rnd.between(30, W - 30), H - 28, 'rock').setOrigin(0.5, 0.8).setDepth(9)
      .setScale(rnd.realInRange(0.6, 1.3));
  }
  for (let i = 0; i < (o.coral || 0); i++) {
    scene.add.image(rnd.between(20, W - 20), H - 30 + rnd.between(0, 10), rnd.pick(['coral_pink', 'coral_orange', 'coral_purple']))
      .setOrigin(0.5, 1).setDepth(9).setScale(rnd.realInRange(1, 1.8));
  }
}

function ambientBubbles(scene, texture = 'bubble') {
  return scene.add.particles(0, 0, texture, {
    x: { min: 0, max: GAME_W }, y: GAME_H + 10,
    speedY: { min: -70, max: -30 }, speedX: { min: -8, max: 8 },
    lifespan: 9000, scale: { min: 0.6, max: 1.5 }, alpha: { start: 0.7, end: 0 },
    frequency: 260,
  }).setScrollFactor(0).setDepth(40);
}

// Angie's round portrait with a white ring. `size` is the diameter in pixels.
function angieAvatar(scene, x, y, size) {
  const c = scene.add.container(x, y);
  const ring = scene.add.graphics();
  ring.fillStyle(0x0b3954, 1).fillCircle(0, 0, size / 2 + 5);
  ring.fillStyle(0xffffff, 1).fillCircle(0, 0, size / 2 + 2);
  c.add([ring, scene.add.image(0, 0, 'angie').setDisplaySize(size, size)]);
  c.setSize(size + 10, size + 10);
  return c;
}

// A sprite of any species, playing the given animation ('idle', 'walk', 'hurt').
function creatureSprite(scene, x, y, species, anim = 'idle') {
  if (species === 'whaleshark') return scene.add.sprite(x, y, 'whaleshark').play('whaleshark_swim').setScale(0.5);
  return scene.add.sprite(x, y, `${species}_${anim}`).play(`${species}_${anim}`).setScale(2);
}
