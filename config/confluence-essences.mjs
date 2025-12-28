/**
 * Confluence Essence configuration
 * Reference data only (do not mutate at runtime).
 *
 * For now: used only as a dropdown catalog.
 * Later: recipes can be used to derive availability from 3 selected Essences.
 */
export const HWFWM_CONFLUENCE_ESSENCES = {
  action: {
    name: "Action",
    recipes: [
      { a: "Gun", b: "Hand", c: "Vehicle" }
    ]
  },

  alchemy: {
    name: "Alchemy",
    recipes: [
      { a: "Adept", b: "Venom", c: "Water" }
    ]
  },

  ambush: {
    name: "Ambush",
    recipes: [
      { a: "Iron", b: "Thread", c: "Trap" },
      { a: "Rune", b: "Spider", c: "Trap" },
      { a: "Earth", b: "Spike", c: "Trap" },
      { a: "Fire", b: "Spider", c: "Trap" }
    ]
  },

  animate: {
    name: "Animate",
    recipes: [
      { a: "Dance", b: "Knowledge", c: "Mirror" },
      { a: "Fungus", b: "Growth", c: "Zeal" },
      { a: "Dance", b: "Dust", c: "Echo" },
      { a: "Bone", b: "Death", c: "Magic" },
      { a: "Cloth", b: "Dance", c: "Magic" }
    ]
  },

  anzu: {
    name: "Anzu",
    recipes: [
      { a: "Bird", b: "Cat", c: "Vast" }
    ]
  },

  arsenal: {
    name: "Arsenal",
    recipes: [
      { a: "Myriad", b: "Shield", c: "Sword" }
    ]
  },

  avatar: {
    name: "Avatar",
    recipes: [
      { a: "Corrupt", b: "Dimension", c: "Magic" },
      { a: "Dark", b: "Tentacle", c: "Void" },
      { a: "Hammer", b: "Lightning", c: "Might" },
      { a: "Blood", b: "Life", c: "Sun" },
      { a: "Dimension", b: "Might", c: "Renewal" },
      { a: "Lightning", b: "Might", c: "Sword" },
      { a: "Rune", b: "Spear", c: "Tree" },
      { a: "Potent", b: "Vast", c: "Water" },
      { a: "Corrupt", b: "Magic", c: "Void" },
      { a: "Corrupt", b: "Dimension", c: "Potent" },
      { a: "Dimension", b: "Tentacle", c: "Void" },
      { a: "Elemental", b: "Harmonic", c: "Potent" },
      { a: "Dimension", b: "Light", c: "Wing" },
      { a: "Eye", b: "Fire", c: "Magic" },
      { a: "Elemental", b: "Might", c: "Resolute" },
      { a: "Corrupt", b: "Dimension", c: "Might" },
      { a: "Magic", b: "Might", c: "Potent" },
      { a: "Blood", b: "Bone", c: "Flesh" }
    ]
  },

  battlefield: {
    name: "Battlefield",
    recipes: [
      { a: "Iron", b: "Spike", c: "Vast" }
    ]
  },

  behemoth: {
    name: "Behemoth",
    recipes: [
      { a: "Cattle", b: "Earth", c: "Vast" }
    ]
  },

  boundary: {
    name: "Boundary",
    recipes: [
      { a: "Balance", b: "Earth", c: "Shield" }
    ]
  },

  bounty: {
    name: "Bounty",
    recipes: [
      { a: "Dance", b: "Feast", c: "Knife" }
    ]
  },

  cataclysm: {
    name: "Cataclysm",
    recipes: [
      { a: "Hunger", b: "Vast", c: "Void" },
      { a: "Dimension", b: "Myriad", c: "Sin" },
      { a: "Fire", b: "Potent", c: "Water" },
      { a: "Death", b: "Myriad", c: "Void" }
    ]
  },

  chaotic: {
    name: "Chaotic",
    recipes: [
      { a: "Balance", b: "Magic", c: "Potent" }
    ]
  },

  charlatan: {
    name: "Charlatan",
    recipes: [
      { a: "Adept", b: "Magic", c: "Trap" }
    ]
  },

  chimera: {
    name: "Chimera",
    recipes: [
      { a: "Cat", b: "Tentacle", c: "Void" },
      { a: "Snake", b: "Spider", c: "Venom" },
      { a: "Earth", b: "Pangolin", c: "Shark" },
      { a: "Lizard", b: "Spider", c: "Wolf" }
    ]
  },

  cyborg: {
    name: "Cyborg",
    recipes: [
      { a: "Death", b: "Iron", c: "Life" },
      { a: "Flesh", b: "Iron", c: "Myriad" },
      { a: "Flesh", b: "Myriad", c: "Technology" },
      { a: "Flesh", b: "Magic", c: "Water" },
      { a: "Death", b: "Flesh", c: "Iron" },
      { a: "Flesh", b: "Iron", c: "Technology" },
      { a: "Flesh", b: "Might", c: "Technology" }
    ]
  },

  cycle: {
    name: "Cycle",
    recipes: [
      { a: "Balance", b: "Light", c: "Renewal" }
    ]
  },

  dawn: {
    name: "Dawn",
    recipes: [
      { a: "Renewal", b: "Sun", c: "Water" },
      { a: "Dark", b: "Light", c: "Sun" },
      { a: "Fire", b: "Omen", c: "Sun" }
    ]
  },

  desolate: {
    name: "Desolate",
    recipes: [
      { a: "Hunger", b: "Locust", c: "Plant" },
      { a: "Blood", b: "Hunger", c: "Locust" },
      { a: "Bone", b: "Dust", c: "Sun" },
      { a: "Cold", b: "Hammer", c: "Sickle" },
      { a: "Sand", b: "Sun", c: "Wind" },
      { a: "Earth", b: "Ice", c: "Wind" },
      { a: "Death", b: "Hunger", c: "Plant" }
    ]
  },

  discordant: {
    name: "Discordant",
    recipes: [
      { a: "Bow", b: "Corrupt", c: "Song" }
    ]
  },

  doom: {
    name: "Doom",
    recipes: [
      { a: "Blood", b: "Dark", c: "Sin" },
      { a: "Blood", b: "Dark", c: "Omen" },
      { a: "Blood", b: "Corrupt", c: "Potent" },
      { a: "Death", b: "Potent", c: "Void" },
      { a: "Blood", b: "Corrupt", c: "Flesh" },
      { a: "Blight", b: "Smoke", c: "Venom" },
      { a: "Death", b: "Potent", c: "Vast" },
      { a: "Death", b: "Dimension", c: "Zeal" },
      { a: "Moon", b: "Omen", c: "Sun" },
      { a: "Growth", b: "Hunger", c: "Void" },
      { a: "Balance", b: "Omen", c: "Sin" },
      { a: "Dark", b: "Hunger", c: "Void" },
      { a: "Corrupt", b: "Feast", c: "Growth" }
    ]
  },

  doppelganger: {
    name: "Doppelganger",
    recipes: [
      { a: "Hunger", b: "Magic", c: "Mirror" },
      { a: "Flesh", b: "Magic", c: "Mirror" }
    ]
  },

  dragon: {
    name: "Dragon",
    recipes: [
      { a: "Magic", b: "Might", c: "Wing" },
      { a: "Magic", b: "Potent", c: "Wing" }
    ]
  },

  eclipse: {
    name: "Eclipse",
    recipes: [
      { a: "Balance", b: "Dark", c: "Light" },
      { a: "Balance", b: "Moon", c: "Sun" },
      { a: "Balance", b: "Omen", c: "Zeal" },
      { a: "Balance", b: "Death", c: "Life" },
      { a: "Dimension", b: "Moon", c: "Sun" }
    ]
  },

  edifice: {
    name: "Edifice",
    recipes: [
      { a: "Earth", b: "Trowel", c: "Vast" }
    ]
  },

  effigy: {
    name: "Effigy",
    recipes: [
      { a: "Rune", b: "Star", c: "Tree" },
      { a: "Dance", b: "Glass", c: "Visage" },
      { a: "Blood", b: "Dark", c: "Shimmer" }
    ]
  },

  empower: {
    name: "Empower",
    recipes: [
      { a: "Magic", b: "Might", c: "Swift" },
      { a: "Blood", b: "Growth", c: "Hunger" },
      { a: "Might", b: "Renewal", c: "Sin" },
      { a: "Elemental", b: "Lightning", c: "Sword" },
      { a: "Frog", b: "Hunger", c: "Void" },
      { a: "Elemental", b: "Hunger", c: "Potent" },
      { a: "Balance", b: "Hunger", c: "Magic" },
      { a: "Lightning", b: "Swift", c: "Sword" },
      { a: "Balance", b: "Blood", c: "Rune" },
      { a: "Cat", b: "Magic", c: "Sun" },
      { a: "Crystal", b: "Magic", c: "Sword" },
      { a: "Flesh", b: "Growth", c: "Potent" },
      { a: "Blood", b: "Hunger", c: "Might" }
    ]
  },

  fertile: {
    name: "Fertile",
    recipes: [
      { a: "Cat", b: "Fungus", c: "Renewal" }
    ]
  },

  fey: {
    name: "Fey",
    recipes: [
      { a: "Magic", b: "Pure", c: "Visage" }
    ]
  },

  firebird: {
    name: "Firebird",
    recipes: [
      { a: "Bird", b: "Fire", c: "Wind" }
    ]
  },

  force: {
    name: "Force",
    recipes: [
      { a: "Magic", b: "Potent", c: "Shield" },
      { a: "Adept", b: "Magic", c: "Might" },
      { a: "Balance", b: "Might", c: "Potent" }
    ]
  },

  forge: {
    name: "Forge",
    recipes: [
      { a: "Iron", b: "Lightning", c: "Technology" },
      { a: "Fire", b: "Iron", c: "Water" },
      { a: "Fire", b: "Iron", c: "Technology" },
      { a: "Bird", b: "Fire", c: "Iron" },
      { a: "Fire", b: "Hammer", c: "Iron" }
    ]
  },

  fortress: {
    name: "Fortress",
    recipes: [
      { a: "Earth", b: "Iron", c: "Shield" }
    ]
  },

  garuda: {
    name: "Garuda",
    recipes: [
      { a: "Bird", b: "Might", c: "Swift" },
      { a: "Might", b: "Swift", c: "Wing" }
    ]
  },

  gate: {
    name: "Gate",
    recipes: [
      { a: "Dimension", b: "Myriad", c: "Rune" },
      { a: "Dimension", b: "Magic", c: "Void" },
      { a: "Dimension", b: "Magic", c: "Rune" }
    ]
  },

  glimeron: {
    name: "Glimeron",
    recipes: [
      { a: "Fire", b: "Mirror", c: "Venom" }
    ]
  },

  gorgon: {
    name: "Gorgon",
    recipes: [
      { a: "Earth", b: "Hair", c: "Snake" }
    ]
  },

  griffin: {
    name: "Griffin",
    recipes: [
      { a: "Bird", b: "Cat", c: "Might" }
    ]
  },

  guardian: {
    name: "Guardian",
    recipes: [
      { a: "Magic", b: "Shield", c: "Void" },
      { a: "Shield", b: "Trap", c: "Void" }
    ]
  },

  harpy: {
    name: "Harpy",
    recipes: [
      { a: "Claw", b: "Malign", c: "Song" },
      { a: "Bird", b: "Discord", c: "Song" },
      { a: "Discord", b: "Song", c: "Wing" }
    ]
  },

  harvest: {
    name: "Harvest",
    recipes: [
      { a: "Axe", b: "Hunt", c: "Plant" },
      { a: "Earth", b: "Plant", c: "Sickle" }
    ]
  },

  hydra: {
    name: "Hydra",
    recipes: [
      { a: "Myriad", b: "Renewal", c: "Snake" }
    ]
  },

  immortal: {
    name: "Immortal",
    recipes: [
      { a: "Life", b: "Magic", c: "Renewal" },
      { a: "Growth", b: "Might", c: "Renewal" },
      { a: "Blood", b: "Potent", c: "Renewal" }
    ]
  },

  juggernaut: {
    name: "Juggernaut",
    recipes: [
      { a: "Might", b: "Swift", c: "Vehicle" },
      { a: "Iron", b: "Might", c: "Swift" }
    ]
  },

  karmic: {
    name: "Karmic",
    recipes: [
      { a: "Balance", b: "Magic", c: "Rune" },
      { a: "Omen", b: "Rune", c: "Star" }
    ]
  },

  kraken: {
    name: "Kraken",
    recipes: [
      { a: "Deep", b: "Myriad", c: "Potent" },
      { a: "Might", b: "Octopus", c: "Vast" },
      { a: "Deep", b: "Might", c: "Octopus" }
    ]
  },

  leviathan: {
    name: "Leviathan",
    recipes: [
      { a: "Fish", b: "Vast", c: "Water" },
      { a: "Deep", b: "Might", c: "Vast" }
    ]
  },

  lotus: {
    name: "Lotus",
    recipes: [
      { a: "Harmonic", b: "Plant", c: "Water" },
      { a: "Plant", b: "Sword", c: "Water" }
    ]
  },

  magitech: {
    name: "Magitech",
    recipes: [
      { a: "Armour", b: "Magic", c: "Technology" },
      { a: "Lightning", b: "Magic", c: "Technology" }
    ]
  },

  manticore: {
    name: "Manticore",
    recipes: [
      { a: "Cat", b: "Spike", c: "Venom" }
    ]
  },

  master: {
    name: "Master",
    recipes: [
      { a: "Foot", b: "Knife", c: "Swift" },
      { a: "Adept", b: "Gathering", c: "Gun" },
      { a: "Adept", b: "Iron", c: "Technology" },
      { a: "Adept", b: "Bow", c: "Swift" },
      { a: "Adept", b: "Myriad", c: "Sword" },
      { a: "Adept", b: "Dance", c: "Sword" },
      { a: "Adept", b: "Fire", c: "Hammer" },
      { a: "Adept", b: "Needle", c: "Thread" },
      { a: "Adept", b: "Foot", c: "Hand" },
      { a: "Adept", b: "Dance", c: "Whip" },
      { a: "Adept", b: "Gun", c: "Swift" },
      { a: "Adept", b: "Gun", c: "Hand" },
      { a: "Dance", b: "Song", c: "Sword" },
      { a: "Adept", b: "Knife", c: "Smoke" },
      { a: "Adept", b: "Magic", c: "Sword" },
      { a: "Cloth", b: "Needle", c: "Thread" },
      { a: "Adept", b: "Swift", c: "Sword" },
      { a: "Adept", b: "Cloth", c: "Needle" },
      { a: "Dance", b: "Sword", c: "Thread" },
      { a: "Adept", b: "Thread", c: "Whip" },
      { a: "Adept", b: "Fire", c: "Iron" },
      { a: "Adept", b: "Magic", c: "Potent" }
    ]
  },

  ministration: {
    name: "Ministration",
    recipes: [
      { a: "Life", b: "Pure", c: "Renewal" }
    ]
  },

  minotaur: {
    name: "Minotaur",
    recipes: [
      { a: "Cattle", b: "Might", c: "Trap" },
      { a: "Cattle", b: "Hunt", c: "Might" }
    ]
  },

  mirage: {
    name: "Mirage",
    recipes: [
      { a: "Fire", b: "Light", c: "Water" },
      { a: "Sun", b: "Vast", c: "Water" },
      { a: "Sand", b: "Sun", c: "Visage" }
    ]
  },

  monolith: {
    name: "Monolith",
    recipes: [
      { a: "Earth", b: "Growth", c: "Might" }
    ]
  },

  mystic: {
    name: "Mystic",
    recipes: [
      { a: "Magic", b: "Might", c: "Staff" },
      { a: "Magic", b: "Omen", c: "Vast" },
      { a: "Magic", b: "Sword", c: "Wind" },
      { a: "Balance", b: "Swift", c: "Wind" },
      { a: "Balance", b: "Dimension", c: "Harmonic" },
      { a: "Iron", b: "Might", c: "Serene" },
      { a: "Dark", b: "Knowledge", c: "Pure" },
      { a: "Dark", b: "Song", c: "Vast" },
      { a: "Adept", b: "Water", c: "Wind" },
      { a: "Balance", b: "Swift", c: "Sword" },
      { a: "Harmonic", b: "Knowledge", c: "Pure" },
      { a: "Balance", b: "Hand", c: "Iron" },
      { a: "Blood", b: "Renewal", c: "Sword" }
    ]
  },

  nebula: {
    name: "Nebula",
    recipes: [
      { a: "Cloud", b: "Vast", c: "Void" }
    ]
  },

  nemesis: {
    name: "Nemesis",
    recipes: [
      { a: "Balance", b: "Mirror", c: "Void" }
    ]
  },

  oasis: {
    name: "Oasis",
    recipes: [
      { a: "Earth", b: "Sand", c: "Water" }
    ]
  },

  ocean: {
    name: "Ocean",
    recipes: [
      { a: "Vast", b: "Vehicle", c: "Water" }
    ]
  },

  onslaught: {
    name: "Onslaught",
    recipes: [
      { a: "Bow", b: "Gathering", c: "Myriad" },
      { a: "Might", b: "Swift", c: "Wind" },
      { a: "Growth", b: "Renewal", c: "Zeal" },
      { a: "Gun", b: "Might", c: "Vehicle" },
      { a: "Gun", b: "Vehicle", c: "Wind" },
      { a: "Might", b: "Potent", c: "Vast" },
      { a: "Growth", b: "Might", c: "Zeal" },
      { a: "Adept", b: "Might", c: "Potent" },
      { a: "Might", b: "Potent", c: "Swift" },
      { a: "Hand", b: "Might", c: "Swift" },
      { a: "Adept", b: "Might", c: "Swift" },
      { a: "Fire", b: "Gun", c: "Vehicle" },
      { a: "Gun", b: "Might", c: "Potent" }
    ]
  },

  phantasmagoria: {
    name: "Phantasmagoria",
    recipes: [
      { a: "Myriad", b: "Vast", c: "Visage" }
    ]
  },

  phoenix: {
    name: "Phoenix",
    recipes: [
      { a: "Fire", b: "Renewal", c: "Wing" }
    ]
  },

  predatory: {
    name: "Predatory",
    recipes: [
      { a: "Bow", b: "Dark", c: "Hunt" },
      { a: "Bow", b: "Hunt", c: "Trap" },
      { a: "Spear", b: "Spider", c: "Wing" },
      { a: "Bow", b: "Spider", c: "Trap" }
    ]
  },

  prison: {
    name: "Prison",
    recipes: [
      { a: "Chain", b: "Iron", c: "Myriad" },
      { a: "Shield", b: "Trap", c: "Vast" },
      { a: "Cage", b: "Rune", c: "Trap" },
      { a: "Cage", b: "Lightning", c: "Myriad" },
      { a: "Gathering", b: "Iron", c: "Might" }
    ]
  },

  prosperity: {
    name: "Prosperity",
    recipes: [
      { a: "Feast", b: "Foot", c: "Rabbit" },
      { a: "Balance", b: "Renewal", c: "Rune" },
      { a: "Magic", b: "Rune", c: "Vast" },
      { a: "Growth", b: "Omen", c: "Sun" },
      { a: "Growth", b: "Renewal", c: "Shield" },
      { a: "Adept", b: "Balance", c: "Renewal" }
    ]
  },

  refracting: {
    name: "Refracting",
    recipes: [
      { a: "Balance", b: "Echo", c: "Ice" }
    ]
  },

  resonating: {
    name: "Resonating",
    recipes: [
      { a: "Bird", b: "Needle", c: "Song" },
      { a: "Crystal", b: "Harmonic", c: "Serene" },
      { a: "Echo", b: "Swift", c: "Wind" }
    ]
  },

  roc: {
    name: "Roc",
    recipes: [
      { a: "Bird", b: "Might", c: "Vast" }
    ]
  },

  sacrifice: {
    name: "Sacrifice",
    recipes: [
      { a: "Blood", b: "Dimension", c: "Goat" },
      { a: "Hunger", b: "Knife", c: "Sun" },
      { a: "Dimension", b: "Knife", c: "Sin" }
    ]
  },

  scribe: {
    name: "Scribe",
    recipes: [
      { a: "Knowledge", b: "Paper", c: "Serene" },
      { a: "Hand", b: "Paper", c: "Rune" }
    ]
  },

  serpent: {
    name: "Serpent",
    recipes: [
      { a: "Fire", b: "Iron", c: "Snake" },
      { a: "Fire", b: "Snake", c: "Wind" },
      { a: "Fire", b: "Snake", c: "Water" }
    ]
  },

  simulacrum: {
    name: "Simulacrum",
    recipes: [
      { a: "Paper", b: "Sword", c: "Visage" }
    ]
  },

  skirmish: {
    name: "Skirmish",
    recipes: [
      { a: "Adept", b: "Bow", c: "Hunt" }
    ]
  },

  sky: {
    name: "Sky",
    recipes: [
      { a: "Moon", b: "Star", c: "Sun" },
      { a: "Star", b: "Sun", c: "Vast" },
      { a: "Cloud", b: "Swift", c: "Wind" }
    ]
  },

  soaring: {
    name: "Soaring",
    recipes: [
      { a: "Swift", b: "Vehicle", c: "Wind" },
      { a: "Bird", b: "Swift", c: "Wind" },
      { a: "Ship", b: "Water", c: "Wind" }
    ]
  },

  sovereign: {
    name: "Sovereign",
    recipes: [
      { a: "Flesh", b: "Magic", c: "Thread" },
      { a: "Dark", b: "Sin", c: "Water" },
      { a: "Adept", b: "Potent", c: "Sceptre" },
      { a: "Adept", b: "Balance", c: "Potent" }
    ]
  },

  stellar: {
    name: "Stellar",
    recipes: [
      { a: "Dark", b: "Star", c: "Sun" }
    ]
  },

  storm: {
    name: "Storm",
    recipes: [
      { a: "Lightning", b: "Potent", c: "Wind" },
      { a: "Deep", b: "Vast", c: "Wind" },
      { a: "Fire", b: "Potent", c: "Wind" },
      { a: "Lightning", b: "Magic", c: "Wind" },
      { a: "Cloud", b: "Crystal", c: "Wind" },
      { a: "Dust", b: "Ice", c: "Wind" },
      { a: "Hammer", b: "Lightning", c: "Rune" },
      { a: "Fire", b: "Gun", c: "Lightning" },
      { a: "Sand", b: "Vast", c: "Wind" },
      { a: "Earth", b: "Fire", c: "Wind" }
    ]
  },

  succubus: {
    name: "Succubus",
    recipes: [
      { a: "Flesh", b: "Sin", c: "Visage" },
      { a: "Hunger", b: "Magic", c: "Sin" }
    ]
  },

  swarm: {
    name: "Swarm",
    recipes: [
      { a: "Bat", b: "Rabbit", c: "Rat" },
      { a: "Dark", b: "Fire", c: "Rat" },
      { a: "Fire", b: "Venom", c: "Wasp" },
      { a: "Potent", b: "Venom", c: "Wasp" },
      { a: "Duck", b: "Flea", c: "Foot" },
      { a: "Blood", b: "Myriad", c: "Wing" }
    ]
  },

  talisman: {
    name: "Talisman",
    recipes: [
      { a: "Magic", b: "Paper", c: "Rune" }
    ]
  },

  thunderbird: {
    name: "Thunderbird",
    recipes: [
      { a: "Bird", b: "Lightning", c: "Vast" }
    ]
  },

  time: {
    name: "Time",
    recipes: [
      { a: "Dimension", b: "Vast", c: "Void" },
      { a: "Balance", b: "Dimension", c: "Swift" }
    ]
  },

  tranquil: {
    name: "Tranquil",
    recipes: [
      { a: "Balance", b: "Moon", c: "Water" },
      { a: "Corrupt", b: "Death", c: "Serene" },
      { a: "Serene", b: "Tree", c: "Vast" }
    ]
  },

  transfiguration: {
    name: "Transfiguration",
    recipes: [
      { a: "Deer", b: "Earth", c: "Hammer" },
      { a: "Bear", b: "Growth", c: "Hand" },
      { a: "Adept", b: "Elemental", c: "Magic" },
      { a: "Balance", b: "Earth", c: "Iron" },
      { a: "Flesh", b: "Growth", c: "Water" },
      { a: "Bird", b: "Mouse", c: "Whale" },
      { a: "Hunt", b: "Moon", c: "Wolf" },
      { a: "Blood", b: "Fire", c: "Iron" },
      { a: "Axe", b: "Bear", c: "Moon" },
      { a: "Hunger", b: "Moon", c: "Wolf" },
      { a: "Balance", b: "Fire", c: "Ice" }
    ]
  },

  transgression: {
    name: "Transgression",
    recipes: [
      { a: "Death", b: "Dimension", c: "Magic" }
    ]
  },

  troll: {
    name: "Troll",
    recipes: [
      { a: "Blood", b: "Might", c: "Renewal" }
    ]
  },

  twilight: {
    name: "Twilight",
    recipes: [
      { a: "Moon", b: "Omen", c: "Wind" },
      { a: "Dark", b: "Light", c: "Moon" }
    ]
  },

  undeath: {
    name: "Undeath",
    recipes: [
      { a: "Corrupt", b: "Dance", c: "Flesh" },
      { a: "Death", b: "Magic", c: "Sand" },
      { a: "Blood", b: "Death", c: "Spider" },
      { a: "Bone", b: "Corrupt", c: "Dance" },
      { a: "Blood", b: "Death", c: "Duck" },
      { a: "Death", b: "Flesh", c: "Hunger" },
      { a: "Blood", b: "Death", c: "Wolf" },
      { a: "Blood", b: "Death", c: "Snake" },
      { a: "Blood", b: "Death", c: "Hunger" },
      { a: "Bone", b: "Corrupt", c: "Flesh" },
      { a: "Bat", b: "Blood", c: "Death" },
      { a: "Blood", b: "Death", c: "Visage" },
      { a: "Blood", b: "Corrupt", c: "Dark" },
      { a: "Blood", b: "Bone", c: "Corrupt" },
      { a: "Blood", b: "Dark", c: "Death" },
      { a: "Blood", b: "Death", c: "Sin" },
      { a: "Blood", b: "Death", c: "Moon" },
      { a: "Blood", b: "Death", c: "Hunt" }
    ]
  },

  unity: {
    name: "Unity",
    recipes: [
      { a: "Mirror", b: "Myriad", c: "Technology" }
    ]
  },

  verdant: {
    name: "Verdant",
    recipes: [
      { a: "Earth", b: "Plant", c: "Vast" },
      { a: "Earth", b: "Shovel", c: "Water" },
      { a: "Earth", b: "Plant", c: "Rake" }
    ]
  },

  vessel: {
    name: "Vessel",
    recipes: [
      { a: "Duck", b: "Iron", c: "Vast" },
      { a: "Balance", b: "Blood", c: "Hunger" },
      { a: "Balance", b: "Life", c: "Needle" },
      { a: "Technology", b: "Vehicle", c: "Wind" },
      { a: "Knowledge", b: "Technology", c: "Vast" },
      { a: "Cloud", b: "Growth", c: "Vehicle" },
      { a: "Iron", b: "Sin", c: "Wind" },
      { a: "Gathering", b: "Magic", c: "Star" },
      { a: "Death", b: "Vehicle", c: "Water" },
      { a: "Rat", b: "Swift", c: "Water" },
      { a: "Dimension", b: "Vast", c: "Vehicle" },
      { a: "Balance", b: "Blood", c: "Crystal" },
      { a: "Duck", b: "Iron", c: "Visage" },
      { a: "Crystal", b: "Magic", c: "Potent" }
    ]
  },

  vision: {
    name: "Vision",
    recipes: [
      { a: "Dark", b: "Omen", c: "Serene" },
      { a: "Eye", b: "Magic", c: "Mirror" }
    ]
  },

  volcano: {
    name: "Volcano",
    recipes: [
      { a: "Earth", b: "Fire", c: "Potent" },
      { a: "Earth", b: "Fire", c: "Vast" }
    ]
  },

  vortex: {
    name: "Vortex",
    recipes: [
      { a: "Shark", b: "Water", c: "Wind" },
      { a: "Trap", b: "Void", c: "Wind" },
      { a: "Deep", b: "Vast", c: "Void" },
      { a: "Corrupt", b: "Dimension", c: "Void" },
      { a: "Dimension", b: "Hunger", c: "Void" },
      { a: "Feast", b: "Magic", c: "Void" },
      { a: "Dark", b: "Void", c: "Wind" }
    ]
  },

  weave: {
    name: "Weave",
    recipes: [
      { a: "Dance", b: "Needle", c: "Thread" },
      { a: "Harmonic", b: "Myriad", c: "Omen" },
      { a: "Dance", b: "Myriad", c: "Thread" }
    ]
  },

  wendigo: {
    name: "Wendigo",
    recipes: [
      { a: "Flesh", b: "Hunger", c: "Might" }
    ]
  },

  wrath: {
    name: "Wrath",
    recipes: [
      { a: "Balance", b: "Blood", c: "Might" },
      { a: "Might", b: "Potent", c: "Zeal" },
      { a: "Fire", b: "Light", c: "Potent" },
      { a: "Adept", b: "Fire", c: "Zeal" },
      { a: "Fire", b: "Light", c: "Zeal" },
      { a: "Dimension", b: "Light", c: "Potent" },
      { a: "Balance", b: "Might", c: "Zeal" },
      { a: "Balance", b: "Potent", c: "Zeal" }
    ]
  },

  ziz: {
    name: "Ziz",
    recipes: [
      { a: "Bird", b: "Vast", c: "Wind" }
    ]
  }
};
