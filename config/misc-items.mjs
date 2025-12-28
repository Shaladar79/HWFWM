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
  // lower, trim, spaces/punct → hyphen, collapse repeats
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

    // Essence
    out[`essence.${slug}`] = {
      name: `Essence: ${n}`,
      group: "Essences",
      quantity: 0,
      notes: ""
    };

    // Quintessence attached to that Essence
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
// 3) Base “non-essence” misc items (optional now)
// ---------------------------------------------
const BASE_MISC = {
  // Sundries (examples; expand later)
  "sundry.rations": { name: "Rations", group: "Sundries", quantity: 1, notes: "" },
  "sundry.rope-50ft": { name: "Rope (50ft)", group: "Sundries", quantity: 1, notes: "" },
  "sundry.torch": { name: "Torch", group: "Sundries", quantity: 1, notes: "" },

  // Awakening Stones (examples; expand later)
  "awakening.stone.lesser": { name: "Awakening Stone (Lesser)", group: "Awakening Stones", quantity: 0, notes: "" },
  "awakening.stone.standard": { name: "Awakening Stone", group: "Awakening Stones", quantity: 0, notes: "" },

  // Other (placeholder bucket)
  "other.placeholder": { name: "Other (Placeholder)", group: "Other", quantity: 1, notes: "" }
};

// ---------------------------------------------
// 4) Final exported flat catalog
// ---------------------------------------------
export const HWFWM_MISC_ITEMS = {
  ...BASE_MISC,
  ...buildEssenceAndQuintessenceCatalog()
};
