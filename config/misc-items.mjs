/**
 * config/misc-items.mjs
 *
 * Misc Inventory Item Catalog
 * - NOT Item documents.
 * - Stored on Actor at: system.treasures.miscItems[key]
 * - UI dropdown expects a FLAT dictionary: { [key]: { name, group, ... } }
 *
 * Entry fields:
 *  - name: string (required)
 *  - group: string (required)  // top-level grouping for UI
 *  - subgroup: string (optional)
 *  - quantity: number (default suggested)
 *  - notes: string (default suggested)
 *
 * NEW (mechanical fields; stored on actor entries):
 *  - rarity: string (default "common")
 *  - value: number (default 1)
 *
 * IMPORTANT:
 * - Confluence Essences are NOT part of this file.
 */

import { getMiscItemValueMeta } from "./misc-item-values.mjs";

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
// NOTE: Flat list of stone names.
// If later you want combo stones like "Earth/Acid/Adventure", we can extend this.
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
// 1c) Quintessence List (explicit source of truth)
// ---------------------------------------------
// NOTE:
// - This is intentionally NOT derived from ESSENCE_NAMES.
// - It starts as a full copy for convenience only.
// - You are expected to REMOVE entries that are not valid Quintessence
//   and ADD new ones that do not exist as Essences.
// - Value / rarity tuning will be handled via misc-item-values.mjs.
const QUINTESSENCE_NAMES = [
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

/**
 * Apply rarity/value metadata to a catalog entry.
 * Value meta is config-driven and safe by default.
 * @param {string} key
 * @param {object} entry
 */
function withValueMeta(key, entry) {
  const meta = getMiscItemValueMeta(key);
  return {
    ...entry,
    rarity: meta.rarity,
    value: meta.value
  };
}

function buildEssenceAndQuintessenceCatalog() {
  const out = {};

  // Essences
  for (const raw of ESSENCE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    const key = `essence.${slug}`;
    out[key] = withValueMeta(key, {
      name: `Essence: ${n}`,
      group: "Essences",
      quantity: 0,
      notes: ""
    });
  }

  // Quintessence (explicit list)
  for (const raw of QUINTESSENCE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    const key = `quintessence.${slug}`;
    out[key] = withValueMeta(key, {
      name: `${n} Quintessence`,
      group: "Quintessence",
      quantity: 0,
      notes: ""
    });
  }

  return out;
}

function buildAwakeningStoneCatalog() {
  const out = {};
  for (const raw of AWAKENING_STONE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    const key = `awakening.${slug}`;
    out[key] = withValueMeta(key, {
      name: `Awakening Stone: ${n}`,
      group: "Awakening Stones",
      quantity: 0,
      notes: ""
    });
  }
  return out;
}

// ---------------------------------------------
// 3) Non-essence misc items (real entries; no placeholders)
// ---------------------------------------------
const BASE_MISC_RAW = {
  // Sundries
  "sundries.rations": {
    name: "Rations",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.waterskin": {
    name: "Waterskin",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.torch": {
    name: "Torch",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.oil-flask": {
    name: "Oil Flask",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.rope-50ft": {
    name: "Rope (50 ft)",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.backpack": {
    name: "Backpack",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.bedroll": {
    name: "Bedroll",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },
  "sundries.tinderbox": {
    name: "Tinderbox",
    group: "Sundries",
    quantity: 0,
    notes: ""
  },

  // Other (catch-all for campaign-specific objects)
  "other.empty-vial": {
    name: "Empty Vial",
    group: "Other",
    quantity: 0,
    notes: ""
  },
  "other.small-pouch": {
    name: "Small Pouch",
    group: "Other",
    quantity: 0,
    notes: ""
  },
  "other.gemstone": {
    name: "Gemstone (Uncut)",
    group: "Other",
    quantity: 0,
    notes: ""
  },
  "other.letter-sealed": {
    name: "Sealed Letter",
    group: "Other",
    quantity: 0,
    notes: ""
  }
};

// Apply value meta to all base misc items without changing their defining block.
const BASE_MISC = Object.fromEntries(
  Object.entries(BASE_MISC_RAW).map(([key, entry]) => [key, withValueMeta(key, entry)])
);

// ---------------------------------------------
// 4) Final exported flat catalog
// ---------------------------------------------
export const HWFWM_MISC_ITEMS = {
  ...BASE_MISC,
  ...buildAwakeningStoneCatalog(),
  ...buildEssenceAndQuintessenceCatalog()
};
