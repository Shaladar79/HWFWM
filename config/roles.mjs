/**
 * Role configuration (display + mechanics hooks).
 *
 * Pattern:
 * - ROLES / ROLE_ORDER: dropdown display
 * - ROLE_ADJUSTMENTS: baseline status deltas (PRE-multiplier; same phase as race/background)
 * - ROLE_BY_RANK: upgrades unlocked at specific character ranks (additive; handled later)
 * - ROLE_DESCRIPTIONS: UI-only notes
 */

export const ROLES = {
  brawler: "Brawler",
  defender: "Defender",
  guardian: "Guardian",
  skirmisher: "Skirmisher",
  healer: "Healer",
  striker: "Striker",
  arcanist: "Arcanist"
};

export const ROLE_ORDER = [
  "brawler",
  "defender",
  "guardian",
  "skirmisher",
  "healer",
  "striker",
  "arcanist"
];

/**
 * Baseline role adjustments (applied BEFORE rank multiplier).
 * NOTE: No pace here by design.
 *
 * These deltas feed the same phase as race/background:
 *   pre = BASE(10) + raceAdj + roleAdj + backgroundAdj
 *   max = round(pre * rankMultiplier)
 */
export const ROLE_ADJUSTMENTS = {
  brawler:    { lifeForce: 7,  mana: 5,  stamina: 8 },
  defender:   { lifeForce: 13, mana: 2,  stamina: 5 },
  guardian:   { lifeForce: 8,  mana: 4,  stamina: 8 },
  skirmisher: { lifeForce: 5,  mana: 7,  stamina: 8 },
  healer:     { lifeForce: 2,  mana: 12, stamina: 6 },
  striker:    { lifeForce: 4,  mana: 6,  stamina: 10 },
  arcanist:   { lifeForce: 1,  mana: 10, stamina: 2 }
};

/**
 * Role upgrades by rank.
 *
 * ROLE_BY_RANK[roleKey][rankKey] = {
 *   status: { lifeForce, mana, stamina },                 // optional (additive; phase TBD)
 *   attributePct: { power, speed, spirit, recovery },     // optional (for later integration)
 *   notes: "..."                                          // optional (UI-only)
 * }
 *
 * NOTE: For now, "normal" entries can represent the role's baseline % identity,
 * even if the mechanical application is implemented later.
 */
export const ROLE_BY_RANK = {
  brawler: {
    normal:  { attributePct: { power: 2 } },
    iron:    {},
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  },

  defender: {
    normal:  { attributePct: { power: 2 } },
    iron:    {}, // you mentioned examples like +2% power at iron; fill when ready
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  },

  guardian: {
    normal:  { attributePct: { speed: 2 } },
    iron:    {},
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  },

  skirmisher: {
    normal:  { attributePct: { speed: 2 } },
    iron:    {},
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  },

  healer: {
    normal:  { attributePct: { recovery: 2 } },
    iron:    {},
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  },

  striker: {
    normal:  { attributePct: { speed: 2 } },
    iron:    {}, // you mentioned examples like +2% speed at iron; fill when ready
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  },

  arcanist: {
    normal:  { attributePct: { spirit: 2 } },
    iron:    {},
    bronze:  {},
    silver:  {},
    gold:    {},
    diamond: {}
  }
};

/**
 * UI-only descriptions.
 */
export const ROLE_DESCRIPTIONS = {
  brawler: "",
  defender: "",
  guardian: "",
  skirmisher: "",
  healer: "",
  striker: "",
  arcanist: ""
};

