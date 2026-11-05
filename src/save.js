// Progress is kept in this browser's localStorage.
const Save = {
  KEY: 'aquari-save-v1',
  data: null,

  defaults() {
    return {
      unlocked: 1,        // number of dives available
      stars: {},          // level index -> best stars
      food: {},           // food type -> amount in the sanctuary pantry
      recycle: 0,         // recycling points from collected trash
      decor: [],          // sanctuary decorations bought
      inCare: [],         // { id, species, name, health }
      friends: [],        // everyone ever rescued: { name, species }
      rescued: {},        // species -> count
      released: {},       // species -> count
      notesFound: {},     // level index -> how many bottle notes found there
      factsSeen: {},      // species -> how many of its facts have been revealed
      oceanFacts: [],     // indexes into OCEAN_FACTS found in shells
      metWhaleShark: false,
      finished: false,
      nextId: 1,
      layout: 2,          // order of the dives (see load)
    };
  },

  load() {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(this.KEY)) || {};
    } catch (e) { /* private window or blocked storage: start fresh */ }
    // older saves kept a list of levels whose single bottle was found
    if (Array.isArray(stored.bottles) && !stored.notesFound) {
      stored.notesFound = {};
      stored.bottles.forEach((lvl) => { stored.notesFound[lvl] = 1; });
    }
    delete stored.bottles;
    // older saves only had krill
    if (typeof stored.krill === 'number') {
      stored.food = Object.assign({ krill: stored.krill }, stored.food);
      delete stored.krill;
    }
    // before layout 2, The Open Ocean was dive 4 and Whale Song Bay dive 5
    if (stored.layout !== 2) {
      ['stars', 'notesFound'].forEach((field) => {
        const m = stored[field];
        if (!m) return;
        [m[3], m[4]] = [m[4], m[3]];
        if (m[3] === undefined) delete m[3];
        if (m[4] === undefined) delete m[4];
      });
      stored.layout = 2;
    }
    this.data = Object.assign(this.defaults(), stored);
    // unlock any dive added after the last one completed
    const done = Object.keys(this.data.stars).map(Number);
    if (done.length) this.data.unlocked = Math.min(LEVELS.length, Math.max(this.data.unlocked, Math.max(...done) + 2));
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

  foodCount(type) {
    return this.data.food[type] || 0;
  },

  addFood(type, n = 1) {
    this.data.food[type] = this.foodCount(type) + n;
  },

  notesIn(level) {
    return PERSONAL.bottleNotes[level] || [];
  },

  notesFoundIn(level) {
    return Math.min(this.data.notesFound[level] || 0, this.notesIn(level).length);
  },

  notesFoundTotal() {
    return LEVELS.reduce((n, _, i) => n + this.notesFoundIn(i), 0);
  },

  notesTotal() {
    return LEVELS.reduce((n, _, i) => n + this.notesIn(i).length, 0);
  },

  // Meeting a species reveals its first fact; each later reveal unlocks the next
  // one, then repeats a random known fact once they've all been found.
  revealFact(species) {
    const facts = SPECIES[species].facts;
    const known = Math.max(1, this.data.factsSeen[species] || 0);
    if (known < facts.length) {
      this.data.factsSeen[species] = known + 1;
      this.store();
      return { fact: facts[known], isNew: true };
    }
    return { fact: Phaser.Utils.Array.GetRandom(facts), isNew: false };
  },

  pickNickname() {
    const used = new Set(this.data.friends.map(f => f.name));
    const free = NICKNAMES.filter(n => !used.has(n));
    if (free.length) return Phaser.Utils.Array.GetRandom(free);
    return Phaser.Utils.Array.GetRandom(NICKNAMES) + ' ' + (this.data.friends.length + 1);
  },
};
