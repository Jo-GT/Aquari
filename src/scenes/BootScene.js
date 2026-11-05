class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, 304, 18).setStrokeStyle(2, 0x7fe3f0);
    const bar = this.add.rectangle(GAME_W / 2 - 150, GAME_H / 2, 0, 12, 0x7fe3f0).setOrigin(0, 0.5);
    this.load.on('progress', (p) => { bar.width = 300 * p; });

    this.load.setPath('assets/');
    const sheet = (key, file, w, h) => this.load.spritesheet(key, file, { frameWidth: w, frameHeight: h });
    sheet('diver_swim', 'diver_swim.png', 128, 128);
    sheet('diver_tread', 'diver_tread.png', 128, 128);
    sheet('whaleshark', 'whaleshark.png', 290, 225);
    sheet('orca', 'orca.png', 104, 34);
    sheet('spout', 'spout.png', 32, 32);
    sheet('bluewhale', 'blue-whale.png', 64, 64);
    sheet('bluewhale_smile', 'blue-whale-smile.png', 64, 64);
    this.load.image('sub', 'sub.png');
    this.load.image('krill', 'krill-3.png');
    CREATURE_KEYS.forEach((k) => {
      ['idle', 'walk', 'hurt'].forEach((a) => sheet(`${k}_${a}`, `creatures/${k}_${a}.png`, 48, 48));
    });
  }

  create() {
    makeTextures(this);
    makeAnims(this);
    Save.load();
    const go = () => {
      if (this.started) return;
      this.started = true;
      this.scene.start('Menu');
    };
    if (document.fonts && document.fonts.load) {
      Promise.all(['400', '600', '700'].map(w => document.fonts.load(`${w} 20px Fredoka`))).then(go, go);
      setTimeout(go, 2500);
    } else {
      go();
    }
  }
}
