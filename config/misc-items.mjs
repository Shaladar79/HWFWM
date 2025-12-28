/**
 * Misc Inventory Item Catalog
 * - NOT Item documents.
 * - Stored on Actor at: system.treasures.miscItems[key]
 * - UI dropdown expects a FLAT dictionary: { [key]: { name, ... } }
 *
 * Entry fields:
 *  - name: string (required)
 *  - group: string (required)  // top-level grouping for future UI
 *  - subgroup: string (optional)
 *  - quantity: number (default suggested)
 *  - notes: string (default suggested)
 *
 * IMPORTANT:
 * - Confluence Essences are NOT part of this file.
 */

// ---------------------------------------------
// 1) Master Essence List (source of truth)
// ---------------------------------------------
const ESSENCE_NAMES = [
  "Adept",
  "Ape",
  "Armour",
  "Axe",
  "Balance",
  "Bat",
  "Bear",
  "Bee",
  "Bird",
  "Blight",
  "Blood",
  "Bone",
  "Bow",
  "Cage",
  "Cat",
  "Cattle",
  "Chain",
  "Claw",
  "Cloth",
  "Cloud",
  "Cold",
  "Coral",
  "Corrupt",
  "Crocodile",
  "Crystal",
  "Dance",
  "Dark",
  "Death",
  "Deep",
  "Deer",
  "Dimension",
  "Discord",
  "Dog",
  "Duck",
  "Dust",
  "Earth",
  "Echo",
  "Elemental",
  "Eye",
  "Feast",
  "Feeble",
  "Fire",
  "Fish",
  "Flea",
  "Flesh",
  "Foot",
  "Fork",
  "Fox",
  "Frog",
  "Fungus",
  "Gathering",
  "Glass",
  "Goat",
  "Grazen",
  "Growth",
  "Gun",
  "Hair",
  "Hammer",
  "Hand",
  "Harmonic",
  "Heidel",
  "Hook",
  "Horse",
  "Hunger",
  "Hunt",
  "Ice",
  "Iron",
  "Knife",
  "Knowledge",
  "Life",
  "Light",
  "Lightning",
  "Lizard",
  "Locust",
  "Lurker",
  "Magic",
  "Malign",
  "Manatee",
  "Might",
  "Mirror",
  "Monkey",
  "Moon",
  "Mouse",
  "Myriad",
  "Needle",
  "Net",
  "Octopus",
  "Omen",
  "Pangolin",
  "Paper",
  "Plant",
  "Potent",
  "Pure",
  "Rabbit",
  "Rake",
  "Rat",
  "Renewal",
  "Resolute",
  "Rune",
  "Sand",
  "Sceptre",
  "Serene",
  "Shark",
  "Shield",
  "Shimmer",
  "Ship",
  "Shovel",
  "Sickle",
  "Sin",
  "Skunk",
  "Sloth",
  "Smoke",
  "Snake",
  "Song",
  "Spear",
  "Spider",
  "Spike",
  "Staff",
  "Star",
  "Sun",
  "Swift",
  "Sword",
  "Technology",
  "Tentacle",
  "Thread",
  "Trap",
  "Tree",
  "Trowel",
  "Turtle",
  "Vast",
  "Vehicle",
  "Venom",
  "Visage",
  "Void",
  "Wall",
  "Wasp",
  "Water",
  "Whale",
  "Wheel",
  "Whip",
  "Wind",
  "Wing",
  "Wolf",
  "Wood",
  "Zeal"
];

// ---------------------------------------------
// 2) Helpers
// ---------------------------------------------
function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")          // remove apostrophes
    .replace(/[^a-z0-9]+/g, "-")   // non-alnum → hyphen
    .replace(/^-+|-+$/g, "")       // trim hyphens
    .replace(/-+/g, "-");          // collapse
}

function buildEssenceAndQuintessenceCatalog() {
  const out = {};

  for (const raw of ESSENCE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    // Essence (stored as misc actor-data item)
    out[`essence.${slug}`] = {
      name: `Essence: ${n}`,
      group: "Essences",
      quantity: 0,
      notes: ""
    };

    // Quintessence linked to that essence (also misc actor-data item)
    out[`quintessence.${slug}`] = {
      name: `${n} Quintessence`,
      group: "Quintessence",
      quantity: 0,
      notes: ""
    };
  }

  return out;
}

// ---------------------------------------------
// 3) Non-essence misc items (starter placeholders)
//    Keep minimal; expand later as you define them.
// ---------------------------------------------
const BASE_MISC = {
  // Sundries (placeholder)
  "sundries.placeholder": {
    name: "Sundries (Placeholder)",
    group: "Sundries",
    quantity: 1,
    notes: ""
  },

  // Awakening Stones (placeholder)
  "awakening-stones.placeholder": {
    name: "Awakening Stones (Placeholder)",
    group: "Awakening Stones",
    quantity: 0,
    notes: ""
  },

  // Other (placeholder)
  "other.placeholder": {
    name: "Other (Placeholder)",
    group: "Other",
    quantity: 1,
    notes: ""
  }
};

// ---------------------------------------------
// 4) Final exported flat catalog
// ---------------------------------------------
export const HWFWM_MISC_ITEMS = {
  ...BASE_MISC,
  ...buildEssenceAndQuintessenceCatalog()
};
