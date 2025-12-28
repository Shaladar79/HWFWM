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
  "Adept","Ape","Armour","Axe","Balance","Bat","Bear","Bee","Bird","Blight","Blood","Bone","Bow",
  "Cage","Cat","Cattle","Chain","Claw","Cloth","Cloud","Cold","Coral","Corrupt","Crocodile",
  "Crystal","Dance","Dark","Death","Deep","Deer","Dimension","Discord","Dog","Duck","Dust","Earth",
  "Echo","Elemental","Eye","Feast","Feeble","Fire","Fish","Flea","Flesh","Foot","Fork","Fox","Frog",
  "Fungus","Gathering","Glass","Goat","Grazen","Growth","Gun","Hair","Hammer","Hand","Harmonic",
  "Heidel","Hook","Horse","Hunger","Hunt","Ice","Iron","Knife","Knowledge","Life","Light","Lightning",
  "Lizard","Locust","Lurker","Magic","Malign","Manatee","Might","Mirror","Monkey","Moon","Mouse",
  "Myriad","Needle","Net","Octopus","Omen","Pangolin","Paper","Plant","Potent","Pure","Rabbit","Rake",
  "Rat","Renewal","Resolute","Rune","Sand","Sceptre","Serene","Shark","Shield","Shimmer","Ship",
  "Shovel","Sickle","Sin","Skunk","Sloth","Smoke","Snake","Song","Spear","Spider","Spike","Staff",
  "Star","Sun","Swift","Sword","Technology","Tentacle","Thread","Trap","Tree","Trowel","Turtle","Vast",
  "Vehicle","Venom","Visage","Void","Wall","Wasp","Water","Whale","Wheel","Whip","Wind","Wing","Wolf",
  "Wood","Zeal"
];

// ---------------------------------------------
// 1b) Awakening Stones (source of truth)
// ---------------------------------------------
// NOTE: I am treating this as a flat list of stone names.
// If you later want “combo stones” like "Earth/Acid/Adventure", we can support that,
// but right now we’ll do one entry per name.
const AWAKENING_STONE_NAMES = [
  "Earth",
  "Acid",
  "Adventure",
  "Absolution",
  "Apocalypse",
  "Eyes",
  "Anticipation",
  "Judgement",
  "Calling",
  "Avatar",
  "Feast",
  "Flesh",
  "Persistence",
  "Champion",
  "Celestials",
  "Feeble",
  "Focus",
  "Ruin",
  "Inevitability",
  "Dimension",
  "Fire",
  "Preparation",
  "Moment",
  "Gate",
  "Lightning",
  "Might",
  "Myriad",
  "Potency",
  "Puberty",
  "Radiant",
  "Sand",
  "Spider",
  "Swiftness",
  "Sword",
  "Wall",
  "Water",
  "Wheel",
  "Wind",
  "Fish",
  "Reach",
  "Omens",
  "Karma",
  "Foot",
  "Song",
  "Purgation",
  "Reaper",
  "Gun",
  "Surge",
  "Sky",
  "Rebirth",
  "Hand",
  "Vision",
  "Stars",
  "Magus",
  "Wrath",
  "Mediocrity",
  "Plant",
  "Rain",
  "Rat",
  "Shield",
  "Snake"
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

    out[`essence.${slug}`] = {
      name: `Essence: ${n}`,
      group: "Essences",
      quantity: 0,
      notes: ""
    };

    out[`quintessence.${slug}`] = {
      name: `${n} Quintessence`,
      group: "Quintessence",
      quantity: 0,
      notes: ""
    };
  }

  return out;
}

function buildAwakeningStoneCatalog() {
  const out = {};
  for (const raw of AWAKENING_STONE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    // Key namespace: awakening.<stone>
    // Display: Awakening Stone: <Name>
    out[`awakening.${slug}`] = {
      name: `Awakening Stone: ${n}`,
      group: "Awakening Stones",
      quantity: 0,
      notes: ""
    };
  }
  return out;
}

// ---------------------------------------------
// 3) Non-essence misc items (minimal placeholders)
// ---------------------------------------------
const BASE_MISC = {
  "sundries.placeholder": {
    name: "Sundries (Placeholder)",
    group: "Sundries",
    quantity: 1,
    notes: ""
  },

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
  ...buildAwakeningStoneCatalog(),
  ...buildEssenceAndQuintessenceCatalog()
};
