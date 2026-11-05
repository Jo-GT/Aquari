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
    this.add.image(ox + 240, 34, 'krill').setScale(2);
    this.krillText = txt(this, ox + 256, 34, '', 20).setOrigin(0, 0.5);
    txt(this, ox + 310, 34, L.name, 16, '#d9f3ffaa').setOrigin(0, 0.5).setVisible(!diver);

    if (diver) {
      txt(this, ox + 316, 34, 'Air', 18, '#d9f3ff').setOrigin(0, 0.5);
      this.add.rectangle(ox + 356, 34, 196, 18, 0x021526).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff, 0.6);
      this.airBar = this.add.rectangle(ox + 359, 34, 190, 12, 0x7fe3f0).setOrigin(0, 0.5);
    }

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
    this.krillText.setText(`${stats.krill}`);
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
