// Species, levels and other game data.

const SPECIES = {
  turtle: {
    name: 'Sea Turtle',
    facts: [
      'Sea turtles have been swimming the oceans for over 100 million years. Leatherbacks can mistake floating plastic bags for jellyfish, their favourite food.',
      'The temperature of the sand decides whether baby sea turtles hatch as boys or girls. Warmer nests make more girls!',
      'Unlike land turtles, sea turtles can\'t pull their heads back into their shells.',
    ],
    tip: 'Carry a reusable bag so plastic ones never reach the sea.',
  },
  jelly: {
    name: 'Jellyfish',
    facts: [
      'Jellyfish have no brain, heart or bones, and they have been drifting through the oceans for more than 500 million years.',
      'A group of jellyfish is called a bloom, or a smack.',
      'The "immortal jellyfish" can turn itself back into a baby polyp and start its whole life over again.',
    ],
    tip: 'Never release balloons. They often end up in the ocean.',
  },
  octopus: {
    name: 'Octopus',
    facts: [
      'Octopuses have three hearts and blue blood, and they can change colour and texture in a split second.',
      'Most of an octopus\'s brain cells are in its arms, so each arm can taste and touch things almost on its own.',
      'With no bones at all, an octopus can squeeze through any gap bigger than its beak.',
    ],
    tip: 'Join (or start!) a local beach clean-up.',
  },
  eel: {
    name: 'Eel',
    facts: [
      'European eels travel thousands of kilometres to the Sargasso Sea to breed, and nobody has ever seen them spawn in the wild.',
      'Baby eels are see-through! At that stage they are called glass eels.',
      'European eels are critically endangered, partly because dams block the rivers they need to swim up.',
    ],
    tip: 'Litter dropped near rivers and drains washes out to sea, so bin it.',
  },
  swordfish: {
    name: 'Swordfish',
    facts: [
      'Swordfish can warm up their eyes and brain, which helps them see clearly while hunting in cold, deep water.',
      'Baby swordfish have scales and teeth, which they lose as they grow up.',
      'Swordfish use their sword to slash at their prey, not to stab it.',
    ],
    tip: 'Choose sustainably caught seafood with a certified label.',
  },
  angler: {
    name: 'Anglerfish',
    facts: [
      'Anglerfish live in the pitch-black deep sea. Females dangle a glowing lure, lit by bacteria, to attract their dinner.',
      'In some anglerfish species, the tiny male fuses onto the much bigger female and stays attached for life.',
      'Anglerfish have stretchy stomachs and can swallow prey up to twice their own size.',
    ],
    tip: 'The deep sea is fragile. Support protections against deep-sea mining and bottom trawling.',
  },
  whaleshark: {
    name: 'Whale Shark',
    special: true,
    facts: [
      'Whale sharks are the biggest fish in the sea, growing up to 18 m long! They are gentle filter-feeders that eat krill and plankton, and every one has a unique pattern of spots, like a fingerprint.',
      'Scientists tell whale sharks apart by photographing their spots, and anyone with a camera can help by sending in their photos.',
      'A whale shark\'s skin can be around 10 cm thick, one of the thickest skins of any animal.',
      'Whale sharks have over 3,000 tiny teeth, but they don\'t use them to eat.',
    ],
    tip: 'Whale sharks are endangered. If you ever swim with one, keep your distance and never touch.',
  },
};

// General ocean facts, found in pearl shells on the seabed and shown on the menu.
const OCEAN_FACTS = [
  'The ocean covers about 71% of Earth\'s surface.',
  'Over half of the oxygen we breathe is made in the ocean, mostly by tiny drifting plants called phytoplankton.',
  'More than 80% of the ocean has never been explored.',
  'The Great Barrier Reef is the largest living structure on Earth. You can see it from space!',
  'Sea otters hold hands while they sleep so they don\'t drift apart.',
  'Dolphins have names! Each one has its own signature whistle.',
  'Seahorse dads are the ones who carry the babies and give birth.',
  'Parrotfish poop sand. Lots of the white sand on tropical beaches came out of a parrotfish!',
  'Blue whales are the biggest animals that have ever lived, bigger than any dinosaur.',
  'Orcas are actually the largest members of the dolphin family.',
  'Coral reefs cover less than 1% of the ocean floor, but around a quarter of all sea creatures live on them.',
  'Many sea turtles return to the very beach where they hatched to lay their own eggs.',
  'Octopuses can taste things just by touching them with their suckers.',
  'The deepest point in the ocean is nearly 11 km down, deeper than Mount Everest is tall.',
  'Antarctic krill are tiny, but together they weigh more than almost any other animal species on Earth.',
  'Sea stars have no blood. They pump seawater around their bodies instead.',
  'Seagrass meadows can lock away carbon up to 35 times faster than rainforests.',
  'About 11 million tonnes of plastic end up in the ocean every year.',
  'Manta rays have some of the biggest brains, for their size, of any fish.',
  'Clownfish are all born male. The biggest fish in a group can turn into a female.',
  'Whale poop fertilises the ocean and feeds the phytoplankton that make our oxygen.',
  'Sharks have been around for longer than trees.',
  'Fish in protected marine areas often grow bigger and more plentiful than outside them.',
  'Some deep-sea creatures make their own light. It\'s called bioluminescence.',
];

// The fact about a species at position `i` (wrapping around).
function speciesFact(key, i = 0) {
  const facts = SPECIES[key].facts;
  return facts[i % facts.length];
}

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
    bottles: [{ x: 2300, y: 738 }, { x: 480, y: 742 }, { x: 1150, y: 110 }],
    shells: 3,
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
    bottles: [{ x: 1240, y: 838 }, { x: 2350, y: 842 }, { x: 2940, y: 110 }],
    shells: 3,
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
    bottles: [{ x: 3080, y: 938 }, { x: 1300, y: 940 }, { x: 2200, y: 150 }],
    shells: 3,
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
    bottles: [{ x: 2000, y: 838 }, { x: 620, y: 110 }, { x: 3320, y: 840 }],
    shells: 3,
    ambient: ['bluewhale', 'orca'],
  },
];
