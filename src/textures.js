// Small textures drawn in code (trash, hearts, kelp...) plus all animations.

function pixelTexture(scene, key, rows, palette, size) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = Math.max(...rows.map(r => r.length));
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (palette[ch] === undefined) return;
      g.fillStyle(palette[ch], 1);
      g.fillRect(x * size, y * size, size, size);
    });
  });
  g.generateTexture(key, w * size, rows.length * size);
  g.destroy();
}

function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  draw(tex.getContext(), w, h);
  tex.refresh();
  return tex;
}

function netTexture(scene, key, w, h, step) {
  canvasTexture(scene, key, w, h, (ctx) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(222, 196, 140, 0.95)';
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + h, 0); ctx.lineTo(i, h); ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(170, 135, 90, 1)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 3, 0, 0.3, Math.PI * 1.7);
    ctx.stroke();
  });
}

function makeTextures(scene) {
  pixelTexture(scene, 'heart', [
    '.RR...RR.',
    'RWRR.RRRR',
    'RRRRRRRRR',
    'RRRRRRRRR',
    '.RRRRRRR.',
    '..RRRRR..',
    '...RRR...',
    '....R....',
  ], { R: 0xff6b9a, W: 0xffffff }, 2);

  const star = [
    '....Y....',
    '...YYY...',
    '...YYY...',
    'YYYYYYYYY',
    '.YYYYYYY.',
    '..YYYYY..',
    '..YYYYY..',
    '.YYY.YYY.',
    '.YY...YY.',
  ];
  pixelTexture(scene, 'star', star, { Y: 0xffd23f }, 4);
  pixelTexture(scene, 'star_empty', star, { Y: 0x24506e }, 4);

  pixelTexture(scene, 'trash_bottle', [
    '..KK..',
    '..KK..',
    '.CCCC.',
    'CCWCCC',
    'CWCCCC',
    'CWLLLC',
    'CCLLLC',
    'CCLLLC',
    'CCCCCC',
    'CCCCCC',
    'CCCCCC',
    '.CCCC.',
  ], { K: 0x2b6cb0, C: 0xbfe8ff, W: 0xffffff, L: 0xff7a59 }, 2);

  pixelTexture(scene, 'trash_can', [
    '.SSSS.',
    'RRRRRR',
    'RWRRRR',
    'RWYYRR',
    'RRYYRR',
    'RRYYRR',
    'RRRRRR',
    'RRRRRR',
    '.SSSS.',
  ], { S: 0xc8ccd0, R: 0xe23b3b, W: 0xffb0b0, Y: 0xffffff }, 2);

  pixelTexture(scene, 'trash_bag', [
    '.HH.....HH.',
    '.H.H...H.H.',
    '.H..H.H..H.',
    '.WWWWWWWWW.',
    'WWWWGWWWWWW',
    'WWWWWWWWGWW',
    'WWGWWWWWWWW',
    'WWWWWWWGWWW',
    'WWWWWWWWWWW',
    '.WWWWWWWWW.',
    '..WWWWWWW..',
  ], { W: 0xf2f5f7, G: 0xc6d3dc, H: 0xe2e8ec }, 2);

  pixelTexture(scene, 'bottle_msg', [
    '...NN...',
    '...NN...',
    '..GGGG..',
    '..GWGG..',
    '.GGGGGG.',
    'GGPPPPGG',
    'GWPPPPGG',
    'GWPRRPGG',
    'GGPPPPGG',
    'GGPPPPGG',
    'GGGGGGGG',
    '.GGGGGG.',
  ], { N: 0xa0703c, G: 0x3fbf8a, W: 0xbfffe0, P: 0xfff1c9, R: 0xff6b9a }, 2);

  pixelTexture(scene, 'shell', [
    '....PPPPP....',
    '..PPWPWPWPP..',
    '.PPWPPWPPWPP.',
    'PWPPWPPWPPWPP',
    'PPWPPWPPWPPWP',
    '.PPPPOOOPPPP.',
    '..DDOOWOODD..',
    '...DDOOODD...',
    '....DDDDD....',
  ], { P: 0xffb3c7, W: 0xffe3ec, D: 0xe58aa5, O: 0xfff6fb }, 2);

  pixelTexture(scene, 'sparkle', [
    '..W..',
    '..W..',
    'WWWWW',
    '..W..',
    '..W..',
  ], { W: 0xffffff }, 2);

  pixelTexture(scene, 'px', ['W'], { W: 0xffffff }, 4);

  const g = scene.make.graphics({ x: 0, y: 0 }, false);

  // six-pack rings
  g.lineStyle(2, 0xe6eef2, 1);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) g.strokeEllipse(7 + c * 9, 6 + r * 8, 11, 9);
  }
  g.generateTexture('trash_rings', 32, 20);

  // bubble
  g.clear();
  g.lineStyle(1.5, 0xffffff, 0.9);
  g.strokeCircle(5, 5, 4);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(3, 3, 2, 2);
  g.generateTexture('bubble', 10, 10);

  // arrow
  g.clear();
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(0, 0, 26, 13, 0, 26);
  g.generateTexture('arrow', 26, 26);

  // kelp
  g.clear();
  for (let y = 0; y < 160; y += 3) {
    const x = 15 + Math.sin(y / 16) * 5;
    g.fillStyle(0x2f8f46, 1);
    g.fillRect(x - 2, y, 5, 4);
  }
  for (let y = 8; y < 150; y += 18) {
    const x = 15 + Math.sin(y / 16) * 5;
    const side = (y / 18) % 2 < 1 ? 1 : -1;
    g.fillStyle(0x47b35e, 1);
    g.fillEllipse(x + side * 7, y + 4, 13, 6);
  }
  g.generateTexture('kelp', 30, 160);

  // corals
  const coral = (key, color, tip) => {
    g.clear();
    g.fillStyle(color, 1);
    g.fillRect(18, 18, 6, 22);
    g.fillRect(7, 12, 5, 16); g.fillRect(7, 24, 14, 5);
    g.fillRect(30, 6, 5, 20); g.fillRect(22, 22, 13, 5);
    g.fillRect(14, 4, 4, 16); g.fillRect(14, 16, 6, 4);
    g.fillStyle(tip, 1);
    [[9, 11], [32, 5], [16, 3], [21, 17]].forEach(([x, y]) => g.fillCircle(x, y, 3));
    g.generateTexture(key, 42, 40);
  };
  coral('coral_pink', 0xff7eb0, 0xffc2db);
  coral('coral_orange', 0xff9a4d, 0xffd2a3);
  coral('coral_purple', 0xa68cff, 0xd9ceff);

  // rock + bubble vent
  g.clear();
  g.fillStyle(0x56657a, 1); g.fillEllipse(35, 26, 70, 28);
  g.fillStyle(0x6f8196, 1); g.fillEllipse(28, 20, 40, 14);
  g.generateTexture('rock', 70, 40);

  g.clear();
  g.fillStyle(0x4a5568, 1); g.fillEllipse(28, 18, 56, 22);
  g.fillStyle(0x667489, 1); g.fillEllipse(22, 13, 28, 9);
  g.fillStyle(0x10161f, 1); g.fillEllipse(28, 10, 16, 6);
  g.generateTexture('vent', 56, 30);
  g.destroy();

  netTexture(scene, 'net', 64, 64, 11);
  netTexture(scene, 'bignet', 260, 200, 18);

  const radial = (key, size, stops) => canvasTexture(scene, key, size, size, (ctx) => {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([p, c]) => grad.addColorStop(p, c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  });
  radial('light', 340, [[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(255,255,255,0.75)'], [1, 'rgba(255,255,255,0)']]);
  radial('light_small', 110, [[0, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]);

  canvasTexture(scene, 'ray', 160, 520, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.32)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(60, 0); ctx.lineTo(100, 0); ctx.lineTo(160, h); ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();
  });
}

function makeAnims(scene) {
  const add = (key, texture, frameRate, extra = {}) => {
    scene.anims.create(Object.assign({
      key,
      frames: scene.anims.generateFrameNumbers(texture),
      frameRate,
      repeat: -1,
    }, extra));
  };
  add('diver_swim', 'diver_swim', 10);
  add('diver_tread', 'diver_tread', 8);
  add('whaleshark_swim', 'whaleshark', 4);
  add('bluewhale', 'bluewhale', 7);
  add('bluewhale_smile', 'bluewhale_smile', 7);
  add('orca', 'orca', 7);
  scene.anims.create({
    key: 'spout',
    frames: scene.anims.generateFrameNumbers('spout', { frames: [0, 2, 1, 2, 1] }),
    frameRate: 6,
    hideOnComplete: true,
  });
  CREATURE_KEYS.forEach((k) => {
    add(`${k}_idle`, `${k}_idle`, 6);
    add(`${k}_walk`, `${k}_walk`, 8);
    add(`${k}_hurt`, `${k}_hurt`, 3);
  });
}
