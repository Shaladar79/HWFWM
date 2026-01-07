/**
 * Background configuration
 * Keys are stored on the actor as system.details.backgroundKey
 */
export const BACKGROUNDS = {
  commoner: "Commoner",
  criminal: "Criminal",
  artisan: "Artisan",
  noble: "Noble",
  scholar: "Scholar",
  soldier: "Soldier",
  merchant: "Merchant"
};

/**
 * Display order (optional but recommended)
 */
export const BACKGROUND_ORDER = [
  "commoner",
  "criminal",
  "artisan",
  "noble",
  "scholar",
  "soldier",
  "merchant"
];

/**
 * Baseline background adjustments (applied before rank multiplier)
 * Shape mirrors races/roles: { lifeForce, mana, stamina }
 */
export const BACKGROUND_ADJUSTMENTS = {
  commoner: { lifeForce: 4, mana: 2, stamina: 2 },
  criminal: { lifeForce: 3, mana: 2, stamina: 3 },
  artisan: { lifeForce: 2, mana: 3, stamina: 3 },
  noble: { lifeForce: 2, mana: 4, stamina: 2 },
  scholar: { lifeForce: 2, mana: 5, stamina: 1 },

  // Placeholders: you said you'll do resource changes for these
  soldier: { lifeForce: 0, mana: 0, stamina: 0 },
  merchant: { lifeForce: 0, mana: 0, stamina: 0 }
};

/**
 * Background → granted specialties
 * NOTE: persisted (one-way add) via listeners.mjs, but not removed if background changes
 *
 * IMPORTANT:
 * - Artisan and Soldier each have ONE fixed grant plus a CHOICE grant (handled separately)
 */
export const BACKGROUND_GRANTED_SPECIALTIES = {
  commoner: ["athletics", "survival"],
  criminal: ["thievery", "stealth"],
  noble: ["persuasion", "leadership"],
  scholar: ["magicTheory", "research"],

  // One fixed grant each; choice handled via BACKGROUND_SPECIALTY_CHOICE
  artisan: ["campcraft"],
  soldier: ["endurance"],

  merchant: ["bartering", "persuasion"]
};

/**
 * Background choice definitions (for dialogs on selection)
 *
 * For now this is config-only wiring. The dialog + persistence is implemented later.
 */
export const BACKGROUND_SPECIALTY_CHOICE = {
  artisan: {
    id: "artisanCraftingChoice",
    label: "Choose a Crafting Specialty",
    count: 1
  },
  soldier: {
    id: "soldierCombatChoice",
    label: "Choose a Combat Specialty",
    count: 1
  }
};

/**
 * Choice option sets (keys must exist in specialtyCatalog)
 *
 * NOTE:
 * - These are intentionally limited to the current catalog keys you have authored.
 * - You can expand freely later without changing any runtime logic.
 */
export const BACKGROUND_CHOICE_OPTIONS = {
  artisanCraftingChoice: [
    "craftingBlacksmithing",
    "craftingWoodworking",
    "craftingTextiles",
    "craftingAlchemy",
    "craftingEngineering",
    "craftingCooking"
  ],
  soldierCombatChoice: [
    "combatGrappling",
    "combatMedium",
    "combatHeavy",
    "combatHurling",
    "combatUnarmed",
    "combatLight",
    "combatThrowing",
    "combatRanged"
  ]
};

/**
 * Optional UI descriptions (Overview / Traits)
 */
export const BACKGROUND_DESCRIPTIONS = {
  commoner: "A practical upbringing grounded in everyday work and community.",
  criminal: "Raised on the wrong side of the law, with hard-earned street instincts.",
  artisan: "Trained in a trade, valuing craft, precision, and steady discipline.",
  noble: "Groomed for status and influence, accustomed to privilege and responsibility.",
  scholar: "Dedicated to learning and theory, with deep academic or institutional training.",
  soldier: "A hardened martial upbringing shaped by drills, discipline, and the realities of conflict.",
  merchant: "A background in trade and negotiation, built on networks, deals, and practical commerce."
};
