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
 * NEW (catalog-only display fields):
 *  - valueLabel: string (optional; e.g. "1000 LSC", "20 GSC")
 *      - Applies to ALL groups including Sundries/Other.
 *  - rarity: string (optional; freeform)
 *      - Applies ONLY to: Essences, Quintessence, Awakening Stones.
 *      - NOT used on Sundries/Other.
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
// 1c) Quintessence List (explicit; editable later)
// ---------------------------------------------
// For now, this is a direct copy of ESSENCE_NAMES. You can diverge later.
const QUINTESSENCE_NAMES = [...ESSENCE_NAMES];

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

  // Essences
  for (const raw of ESSENCE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    // Keys are stable namespaces: essence.<slug>
    out[`essence.${slug}`] = {
      name: `Essence: ${n}`,
      group: "Essences",
      quantity: 0,
      notes: "",

      // NEW
      valueLabel: "",
      rarity: ""
    };
  }

  // Quintessence (explicit list)
  for (const raw of QUINTESSENCE_NAMES) {
    const n = String(raw).trim();
    if (!n) continue;

    const slug = slugify(n);

    // Keys are stable namespaces: quintessence.<slug>
    out[`quintessence.${slug}`] = {
      name: `${n} Quintessence`,
      group: "Quintessence",
      quantity: 0,
      notes: "",

      // NEW
      valueLabel: "",
      rarity: ""
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

    // Key namespace: awakening.<slug>
    // Display: Awakening Stone: <Name>
    out[`awakening.${slug}`] = {
      name: `Awakening Stone: ${n}`,
      group: "Awakening Stones",
      quantity: 0,
      notes: "",

      // NEW
      valueLabel: "",
      rarity: ""
    };
  }
  return out;
}

// ---------------------------------------------
// 3) Non-essence misc items (real entries; no placeholders)
// ---------------------------------------------
const BASE_MISC = {
  // Sundries
  "sundries.rations": {
    name: "Rations",
    group: "Sundries",
    quantity: 0,
    notes: "",
    // NEW (value allowed; rarity NOT used here)
    valueLabel: ""
  },
  "sundries.waterskin": {
    name: "Waterskin",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "sundries.torch": {
    name: "Torch",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "sundries.oil-flask": {
    name: "Oil Flask",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "sundries.rope-50ft": {
    name: "Rope (50 ft)",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "sundries.backpack": {
    name: "Backpack",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "sundries.bedroll": {
    name: "Bedroll",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "sundries.tinderbox": {
    name: "Tinderbox",
    group: "Sundries",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },

  // Other (catch-all for campaign-specific objects)
  "other.empty-vial": {
    name: "Empty Vial",
    group: "Other",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "other.small-pouch": {
    name: "Small Pouch",
    group: "Other",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "other.gemstone": {
    name: "Gemstone (Uncut)",
    group: "Other",
    quantity: 0,
    notes: "",
    valueLabel: ""
  },
  "other.letter-sealed": {
    name: "Sealed Letter",
    group: "Other",
    quantity: 0,
    notes: "",
    valueLabel: ""
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
