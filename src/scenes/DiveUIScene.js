// HUD drawn on top of DiveScene (it doesn't scroll with the camera).
class DiveUIScene extends Phaser.Scene {
  constructor() { super('DiveUI'); }

  init(data) {
    this.dive = data.dive;
  }

  create() {
    const L = this.dive.L;
    this._uiPointer = false;
    this._toasts = [];
    this._toastBusy = false;
    this.input.on('pointerup', () => { this._uiPointer = false; });

    const diver = L.vehicle === 'diver';
    const panelW = diver ? 580 : 420;
    const g = this.add.graphics();
    g.fillStyle(0x0b3954, 0.75);
    g.fillRoundedRect(30, 10, panelW, 48, 16);
    angieAvatar(this, 40, 38, 56);

    const ox = 54;  // room for the avatar
    this.add.image(ox + 32, 34, 'heart').setScale(1.4);
    this.rescueText = txt(this, ox + 48, 34, '', 20).setOrigin(0, 0.5);
    this.add.image(ox + 132, 34, 'trash_bottle').setScale(1.2);
    this.trashText = txt(this, ox + 146, 34, '', 20).setOrigin(0, 0.5);
    this.add.image(ox + 238, 34, 'food_fish').setScale(1.6);
    this.foodText = txt(this, ox + 256, 34, '', 20).setOrigin(0, 0.5);
    txt(this, ox + 310, 34, L.name, 16, '#d9f3ffaa').setOrigin(0, 0.5).setVisible(!diver);

    if (diver) {
      txt(this, ox + 316, 34, 'Air', 18, '#d9f3ff').setOrigin(0, 0.5);
      this.add.rectangle(ox + 356, 34, 196, 18, 0x021526).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 0.6);
      this.airBar = this.add.rectangle(ox + 359, 34, 190, 12, 0x7fe3f0).setOrigin(0, 0.5);
    }

    // second row: bottles and shells found this dive
    g.fillRoundedRect(76, 62, 190, 32, 12);
    this.add.image(ox + 44, 78, 'bottle_msg').setScale(0.9).setAngle(70);
    this.bottleText = txt(this, ox + 58, 78, '', 17).setOrigin(0, 0.5);
    this.add.image(ox + 128, 78, 'shell').setScale(1.2);
    this.shellText = txt(this, ox + 146, 78, '', 17).setOrigin(0, 0.5);

    this.factBox = null;

    const mute = button(this, GAME_W - 186, 34, Sound.isMuted() ? 'Sound: off' : 'Sound: on', () => {
      mute.label.setText(Sound.toggleMute() ? 'Sound: off' : 'Sound: on');
    }, { w: 120, h: 42, size: 16, fill: 0x9ad8ff });
    button(this, GAME_W - 66, 34, 'Pause', () => this.dive.openPause(), { w: 108, h: 42, size: 18, fill: 0x9ad8ff });

    this.arrow = this.add.container(0, 0).setVisible(false);
    this.arrowHead = this.add.image(0, 0, 'arrow').setTint(0xff6b9a);
    this.arrow.add([this.arrowHead, this.add.image(0, 0, 'heart').setScale(1.1)]);
    this.tweens.add({ targets: this.arrow, scale: 1.15, duration: 450, yoyo: true, repeat: -1 });

    this.dive.onUiReady(this);
  }

  setStats(stats, L) {
    this.rescueText.setText(`${stats.rescued}/${L.rescues.length}`);
    this.trashText.setText(`${stats.trash}/${L.trash}`);
    this.foodText.setText(`${stats.food}`);
    const lvl = this.dive.levelIndex;
    this.bottleText.setText(`${Save.notesFoundIn(lvl)}/${Save.notesIn(lvl).length}`);
    this.shellText.setText(`${stats.shells}/${L.shells || 0}`);
  }

  // "Did you know?" banner along the bottom. It doesn't pause the game.
  showFact(text) {
    if (this.factBox) this.factBox.destroy();
    const c = this.add.container(GAME_W / 2, GAME_H + 80).setDepth(800);
    const body = txt(this, 30, 12, text, 17, '#0b3954', { wordWrap: { width: 600 }, fontStyle: '400', lineSpacing: 3 })
      .setOrigin(0.5, 0);
    const h = body.height + 52;
    const bg = this.add.graphics();
    bg.fillStyle(0xfff8e7, 0.97).fillRoundedRect(-340, -h / 2, 680, h, 18);
    bg.lineStyle(3, 0xff9ec0, 1).strokeRoundedRect(-340, -h / 2, 680, h, 18);
    body.y = -h / 2 + 36;
    c.add([
      bg,
      this.add.image(-300, 0, 'shell').setScale(2.4),
      txt(this, 30, -h / 2 + 10, 'Did you know?', 17, '#d1588a', { fontStyle: '700' }).setOrigin(0.5, 0),
      body,
    ]);
    this.factBox = c;
    const y = GAME_H - h / 2 - 12;
    this.tweens.chain({
      targets: c,
      tweens: [
        { y, duration: 350, ease: 'Back.out' },
        { y, duration: 7500 },
        { y: GAME_H + h, duration: 300, ease: 'Sine.in' },
      ],
      onComplete: () => { c.destroy(); if (this.factBox === c) this.factBox = null; },
    });
  }

  setAir(value, refilling) {
    if (!this.airBar) return;
    this.airBar.width = 190 * value / 100;
    this.airBar.fillColor = value < 25 && !refilling ? 0xff6b6b : refilling ? 0x7cffb2 : 0x7fe3f0;
  }

  setArrow(visible, x, y, angle) {
    this.arrow.setVisible(visible);
    if (!visible) return;
    this.arrow.setPosition(x, y);
    this.arrowHead.setRotation(angle);
    this.arrowHead.setPosition(Math.cos(angle) * 18, Math.sin(angle) * 18);
  }
}
