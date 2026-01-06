/**
 * Role configuration (display + mechanics hooks).
 *
 * Pattern:
 * - ROLES / ROLE_ORDER: dropdown display
 * - ROLE_ADJUSTMENTS: baseline adjustments (Normal-tier baseline to statuses)
 * - ROLE_BY_RANK: additive upgrades unlocked at specific ranks
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
 * Baseline role adjustments (Normal rank baseline).
 * Applied AFTER rank scaling, similar to race adjustments.
 * NOTE: No pace here by design.
 */
export const ROLE_ADJUSTMENTS = {
  brawler:   { lifeForce: 7, mana: 5, stamina: 8 },
  defender:  { lifeForce: 13, mana: 2, stamina: 5 },
  guardian:  { lifeForce: 8, mana: 4, stamina: 8 },
  skirmisher:{ lifeForce: 5, mana: 7, stamina: 8 },
  healer:    { lifeForce: 2, mana: 12, stamina: 6 },
  striker:   { lifeForce: 4, mana: 6, stamina: 10 },
  arcanist:   { lifeForce: 1, mana: 10, stamina: 2 }
};

/**
 * Role upgrades by rank.
 *
 * ROLE_BY_RANK[roleKey][rankKey] = {
 *   status: { lifeForce, mana, stamina },      // optional
 *   attributePct: { power, speed, spirit, recovery }, // optional
 *   notes: "..."                               // UI-only
 * }
 */
export const ROLE_BY_RANK = {

   arcanist: {
    normal: {attributePct: { spirit: 2 }}
  },
  
  brawler: {
    normal: {attributePct: { power: 2 }}
  },

  defender: {
    normal: { attributePct: { power: 2 },
      },

    iron: {}
  },

  guardian: {
    normal: {attributePct: { speed: 2 }}
  },

  skirmisher: {
    normal: {attributePct: { speed: 2 }}
  },

  healer: {
    normal: {attributePct: { recovery: 2 }}
  },

  striker: {
    normal: {attributePct: { speed: 2 },
    },

    iron: {}
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

