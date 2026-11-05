// Music, background ambience and sound effects.
// Music and ambience load on demand (only what the current screen needs) so the
// game starts quickly. Short effects load up front; tiny blips (pickups,
// buttons) are generated in code since there are no files for them.

const AUDIO_DIR = 'assets/audio/';
const PRELOADED_AUDIO = ['sfx_ping', 'sfx_release', 'sfx_whale', 'sfx_whale_deep', 'sfx_orca', 'amb_move'];

const Sound = {
  game: null,
  tracks: { music: null, ambience: null },  // { key, sound } currently playing
  wanted: { music: null, ambience: null },  // latest request, so slow loads don't start stale tracks
  volumes: { music: 0.4, ambience: 0.3, move: 0.3 },
  move: null,

  init(game) {
    this.game = game;
    game.sound.mute = !!Save.data.muted;
  },

  isMuted() {
    return !!Save.data.muted;
  },

  toggleMute() {
    Save.data.muted = !Save.data.muted;
    Save.store();
    this.game.sound.mute = Save.data.muted;
    return Save.data.muted;
  },

  // Loads `key` with the scene's loader if it isn't cached yet, then calls `done`.
  ensure(scene, key, done) {
    if (scene.cache.audio.exists(key)) { done(); return; }
    scene.load.audio(key, `${AUDIO_DIR}${key}.mp3`);
    scene.load.once(`filecomplete-audio-${key}`, done);
    if (!scene.load.isLoading()) scene.load.start();
  },

  // Volume fades run on a timer rather than scene tweens so they survive scene changes.
  fade(snd, to, ms, then) {
    clearInterval(snd.fadeTimer);
    const from = snd.volume;
    const start = performance.now();
    snd.fadeTimer = setInterval(() => {
      if (!snd.manager) { clearInterval(snd.fadeTimer); return; }
      const t = Math.min(1, (performance.now() - start) / ms);
      snd.setVolume(from + (to - from) * t);
      if (t >= 1) {
        clearInterval(snd.fadeTimer);
        if (then) then();
      }
    }, 50);
  },

  // Cross-fades a looping channel ('music' or 'ambience') to `key`; null fades it out.
  setChannel(scene, channel, key) {
    this.wanted[channel] = key;
    const cur = this.tracks[channel];
    if (cur && cur.key === key) return;
    if (cur) {
      const old = cur.sound;
      this.fade(old, 0, 800, () => old.destroy());
      this.tracks[channel] = null;
    }
    if (!key) return;
    this.ensure(scene, key, () => {
      if (this.wanted[channel] !== key || (this.tracks[channel] && this.tracks[channel].key === key)) return;
      const snd = this.game.sound.add(key, { loop: true, volume: 0 });
      this.tracks[channel] = { key, sound: snd };
      const start = () => {
        if (!snd.manager) return;
        snd.play();
        this.fade(snd, this.volumes[channel], 1500);
      };
      // browsers only allow audio after the first tap or key press
      if (this.game.sound.locked) this.game.sound.once('unlocked', start); else start();
    });
  },

  music(scene, key) { this.setChannel(scene, 'music', key); },
  ambience(scene, key) { this.setChannel(scene, 'ambience', key); },

  // Swimming noise that gets louder the faster Angie moves (amount 0..1).
  setMoving(amount) {
    if (!this.move) {
      if (!this.game.cache.audio.exists('amb_move') || this.game.sound.locked) return;
      this.move = this.game.sound.add('amb_move', { loop: true, volume: 0 });
      this.move.play();
    }
    const target = amount * this.volumes.move;
    this.move.setVolume(this.move.volume + (target - this.move.volume) * 0.08);
  },

  stopMoving() {
    if (this.move) this.move.setVolume(0);
  },

  // A recorded effect (sfx_*) or a generated blip (see BLIPS).
  sfx(key, volume = 1) {
    if (!this.game || this.game.sound.mute) return;
    if (BLIPS[key]) { BLIPS[key](); return; }
    if (this.game.cache.audio.exists(key)) this.game.sound.play(key, { volume: 0.7 * volume });
  },

  // notes: [startFreq, endFreq, startTime, duration] in Hz / seconds
  tone(notes, type, vol) {
    const mgr = this.game.sound;
    const ctx = mgr.context;
    if (!ctx || mgr.mute || ctx.state !== 'running') return;
    const out = mgr.masterVolumeNode || ctx.destination;
    const now = ctx.currentTime;
    notes.forEach(([f0, f1, at, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, now + at);
      osc.frequency.exponentialRampToValueAtTime(f1, now + at + dur);
      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(vol, now + at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
      osc.connect(gain);
      gain.connect(out);
      osc.start(now + at);
      osc.stop(now + at + dur + 0.02);
    });
  },
};

const BLIPS = {
  click: () => Sound.tone([[660, 660, 0, 0.05]], 'square', 0.03),
  pop: () => Sound.tone([[520, 900, 0, 0.09]], 'sine', 0.12),
  trash: () => Sound.tone([[260, 440, 0, 0.12]], 'triangle', 0.12),
  chime: () => Sound.tone([[880, 880, 0, 0.25], [1320, 1320, 0.09, 0.35]], 'triangle', 0.1),
  snip: () => Sound.tone([[1400, 500, 0, 0.08]], 'sawtooth', 0.05),
  yum: () => Sound.tone([[660, 660, 0, 0.12], [880, 880, 0.08, 0.12], [1100, 1100, 0.16, 0.22]], 'triangle', 0.1),
  oops: () => Sound.tone([[400, 240, 0, 0.25]], 'sine', 0.1),
  fanfare: () => Sound.tone([[523, 523, 0, 0.18], [659, 659, 0.14, 0.18], [784, 784, 0.28, 0.18], [1047, 1047, 0.42, 0.5]], 'triangle', 0.12),
};
