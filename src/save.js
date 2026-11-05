// Progress is kept in this browser's localStorage.
const Save = {
  KEY: 'aquari-save-v1',
  data: null,

  defaults() {
    return {
      unlocked: 1,        // number of dives available
      stars: {},          // level index -> best stars
      krill: 0,           // food for the sanctuary
      inCare: [],         // { id, species, name, health }
      friends: [],        // everyone ever rescued: { name, species }
      rescued: {},        // species -> count
      released: {},       // species -> count
      bottles: [],        // level indexes whose bottle was found
      metWhaleShark: false,
      finished: false,
      nextId: 1,
    };
  },

  load() {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch (e) { /* private window or blocked storage: start fresh */ }
    this.data = Object.assign(this.defaults(), stored);
    return this.data;
  },

  store() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) { /* ignore */ }
  },

  reset() {
    this.data = this.defaults();
    this.store();
  },

  pickNickname() {
    const used = new Set(this.data.friends.map(f => f.name));
    const free = NICKNAMES.filter(n => !used.has(n));
    if (free.length) return Phaser.Utils.Array.GetRandom(free);
    return Phaser.Utils.Array.GetRandom(NICKNAMES) + ' ' + (this.data.friends.length + 1);
  },
};
