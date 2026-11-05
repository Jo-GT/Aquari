// Species, levels and other game data.

const SPECIES = {
  turtle: {
    name: 'Sea Turtle',
    fact: 'Sea turtles have been swimming the oceans for over 100 million years. Leatherbacks can mistake floating plastic bags for jellyfish, their favourite food.',
    tip: 'Carry a reusable bag so plastic ones never reach the sea.',
  },
  jelly: {
    name: 'Jellyfish',
    fact: 'Jellyfish have no brain, heart or bones, and they have been drifting through the oceans for more than 500 million years.',
    tip: 'Never release balloons. They often end up in the ocean.',
  },
  octopus: {
    name: 'Octopus',
    fact: 'Octopuses have three hearts and blue blood, and they can change colour and texture in a split second.',
    tip: 'Join (or start!) a local beach clean-up.',
  },
  eel: {
    name: 'Eel',
    fact: 'European eels travel thousands of kilometres to the Sargasso Sea to breed, and nobody has ever seen them spawn in the wild.',
    tip: 'Litter dropped near rivers and drains washes out to sea, so bin it.',
  },
  swordfish: {
    name: 'Swordfish',
    fact: 'Swordfish can warm up their eyes and brain, which helps them see clearly while hunting in cold, deep water.',
    tip: 'Choose sustainably caught seafood with a certified label.',
  },
  angler: {
    name: 'Anglerfish',
    fact: 'Anglerfish live in the pitch-black deep sea. Females dangle a glowing lure, lit by bacteria, to attract their dinner.',
    tip: 'The deep sea is fragile. Support protections against deep-sea mining and bottom trawling.',
  },
  whaleshark: {
    name: 'Whale Shark',
    special: true,
    fact: 'Whale sharks are the biggest fish in the sea, growing up to 18 m long! They are gentle filter-feeders that eat krill and plankton, and every one has a unique pattern of spots, like a fingerprint.',
    tip: 'Whale sharks are endangered. If you ever swim with one, keep your distance and never touch.',
  },
};

const SPECIES_ORDER = ['turtle', 'jelly', 'octopus', 'eel', 'swordfish', 'angler', 'whaleshark'];
const CREATURE_KEYS = ['turtle', 'jelly', 'octopus', 'eel', 'swordfish', 'angler'];

const NICKNAMES = [
  'Pebble', 'Bubbles', 'Noodle', 'Biscuit', 'Mango', 'Pip', 'Waffles', 'Sunny', 'Nori', 'Tofu',
  'Squish', 'Coral', 'Pickle', 'Marble', 'Dumpling', 'Peanut', 'Mochi', 'Sprout', 'Button', 'Taro',
];

const LEVELS = [
  {
    key: 'shallows',
    name: 'Sunny Shallows',
    blurb: 'Warm, bright water by the reef. A few friends have got tangled up in litter.',
    vehicle: 'diver',
    width: 2400, height: 800,
    top: '#8ff0f5', bottom: '#1c86b0', far: 0x2a86a6, sand: 0xf2d39b,
    murk: 0x6d7f3c, murkAlpha: 0.45,
    kelp: 8, coral: 16, rocks: 6,
    oxygenDrain: 1.4,
    start: { x: 160, y: 200 },
    rescues: [
      { species: 'turtle', x: 760, y: 560 },
      { species: 'jelly', x: 1380, y: 300 },
      { species: 'turtle', x: 2060, y: 620 },
    ],
    trash: 14, krill: 5, vents: [620, 1650],
    bottle: { x: 2300, y: 738 },
    ambient: ['bluewhale'],
  },
  {
    key: 'kelp',
    name: 'Kelp Forest',
    blurb: 'A swaying forest of giant kelp. Lots of places for litter (and secrets) to hide.',
    vehicle: 'diver',
    width: 3000, height: 900,
    top: '#5fd6be', bottom: '#0e4d5a', far: 0x135e5e, sand: 0xc9b27a,
    murk: 0x4f5a2a, murkAlpha: 0.5,
    kelp: 46, coral: 10, rocks: 10,
    oxygenDrain: 1.5,
    start: { x: 160, y: 200 },
    rescues: [
      { species: 'octopus', x: 820, y: 720 },
      { species: 'eel', x: 1500, y: 790 },
      { species: 'turtle', x: 2100, y: 420 },
      { species: 'jelly', x: 2700, y: 260 },
    ],
    trash: 18, krill: 6, vents: [700, 1700, 2600],
    bottle: { x: 1240, y: 838 },
    ambient: [],
  },
  {
    key: 'deep',
    name: 'The Twilight Deep',
    blurb: `It's pitch black down here, so ${PERSONAL.heroName} is taking the submarine. Follow the faint glows!`,
    vehicle: 'sub',
    width: 3200, height: 1000,
    top: '#1d3f73', bottom: '#040a1c', far: 0x0a1836, sand: 0x3a3f5a,
    murk: 0x2a2f1a, murkAlpha: 0.4,
    kelp: 0, coral: 10, rocks: 14,
    dark: true,
    start: { x: 160, y: 160 },
    rescues: [
      { species: 'angler', x: 900, y: 820 },
      { species: 'swordfish', x: 1700, y: 420 },
      { species: 'octopus', x: 2400, y: 880 },
      { species: 'angler', x: 2950, y: 600 },
    ],
    trash: 16, krill: 6, vents: [],
    bottle: { x: 3080, y: 938 },
    ambient: [],
  },
  {
    key: 'ocean',
    name: 'The Open Ocean',
    blurb: 'Big blue water where the whales roam. Someone very special is out here and needs help.',
    vehicle: 'diver',
    width: 3400, height: 900,
    top: '#a6e6ff', bottom: '#1b5fa3', far: 0x2a6fae, sand: 0xe6cf98,
    murk: 0x7a8a50, murkAlpha: 0.4,
    kelp: 6, coral: 12, rocks: 6,
    oxygenDrain: 1.3,
    start: { x: 160, y: 200 },
    rescues: [
      { species: 'swordfish', x: 900, y: 460 },
      { species: 'turtle', x: 1600, y: 660 },
      { species: 'jelly', x: 2250, y: 280 },
      { species: 'whaleshark', x: 3050, y: 470 },
    ],
    trash: 20, krill: 7, vents: [800, 1900, 2700],
    bottle: { x: 2000, y: 838 },
    ambient: ['bluewhale', 'orca'],
  },
];
