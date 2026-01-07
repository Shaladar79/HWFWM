/**
 * Role configuration (display + mechanics hooks).
 *
 * Pattern:
 * - ROLES / ROLE_ORDER: dropdown display
 * - ROLE_ADJUSTMENTS: baseline resource deltas (PRE-multiplier)
 * - ROLE_GRANTED_SPECIALTIES: fixed specialty grants (2 per role)
 * - ROLE_BY_RANK: rank-based unlocks (future-facing)
 * - ROLE_DESCRIPTIONS: UI-only text
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
 * These stack with race + background in the same phase.
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
 * Fixed role-granted specialties.
 * - Exactly  hookup; duplicate grants handled by actor logic
 * - No combat specialties
 * - No aura control
 * - No choice rules
 */
export const ROLE_GRANTED_SPECIALTIES = {
  brawler:    ["athletics", "endurance"],
  defender:   ["endurance", "painTolerance"],
  guardian:   ["perception", "survival"],
  skirmisher: ["acrobatics", "stealth"],
  healer:     ["firstAid", "ritualMagic"],
  striker:    ["acrobatics", "perception"],
  arcanist:   ["magicTheory", "ritualMagic"]
};

/**
 * Role upgrades by rank.
 * Placeholder surface only — no mechanical enforcement yet.
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
    iron:    {},
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
    iron:    {},
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
 * UI-only role descriptions.
 */
export const ROLE_DESCRIPTIONS = {
  brawler:    "A close-quarters combatant who relies on strength, grit, and endurance.",
  defender:   "A stalwart frontliner focused on protection, resilience, and control.",
  guardian:   "A vigilant protector attuned to threats and environmental awareness.",
  skirmisher: "A mobile fighter emphasizing agility, positioning, and evasion.",
  healer:     "A support specialist trained in restoration, rituals, and stabilization.",
  striker:    "An aggressive combatant focused on speed, pressure, and decisive action.",
  arcanist:   "A scholar of magic who studies theory and performs structured rituals."
};
