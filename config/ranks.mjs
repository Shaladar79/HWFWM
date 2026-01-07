/**
 * Rank configuration (display + numeric rules).
 * Mechanics will consume these values later.
 */

export const RANKS = {
  normal: "Normal",
  iron: "Iron",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond"
};

/**
 * Canonical ordering for iteration and dropdowns.
 */
export const RANK_ORDER = [
  "normal",
  "iron",
  "bronze",
  "silver",
  "gold",
  "diamond"
];

/**
 * Base attribute value per rank
 * Used by Actor.prepareDerivedData()
 */
export const RANK_BASE_ATTRIBUTES = {
  normal: 30,
  iron: 35,
  bronze: 40,
  silver: 45,
  gold: 50,
  diamond: 55
};

/**
 * Tier value per rank
 * Used for derived character rank calculation (header)
 */
export const RANK_TIER_VALUE = {
  normal: 0,
  iron: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  diamond: 5
};

/**
 * Rank multipliers
 * Used for Life Force / Mana / Stamina scaling
 */
export const RANK_RESOURCE_MULTIPLIER = {
  normal: 1,
  iron: 1.5,
  bronze: 3,
  silver: 5,
  gold: 7.5,
  diamond: 10
};

/**
 * Rank-based Pace modifier
 * Added on top of base Pace calculation
 */
export const RANK_PACE_MOD = {
  normal: 0,
  iron: 1,
  bronze: 2,
  silver: 4,
  gold: 6,
  diamond: 8
};

/**
 * Rank-based Trauma value
 * Determines baseline Trauma by character rank
 */
export const RANK_TRAUMA = {
  normal: 3,
  iron: 4,
  bronze: 5,
  silver: 7,
  gold: 9,
  diamond: 12
};

/**
 * Base recovery rates per rank (AUTHORITATIVE BASELINE).
 *
 * Units: "per recovery interval" (interval definition is a system rule to be finalized later).
 * For now, this establishes non-zero, testable baseline values.
 *
 * Modifiers may later add to or multiply these values (race/role/background/affinity/aptitude/features).
 */
export const RANK_BASE_RECOVERY = {
  normal:  { mana: 1, stamina: 1, lifeForce: 1 },
  iron:    { mana: 2, stamina: 2, lifeForce: 2 },
  bronze:  { mana: 3, stamina: 3, lifeForce: 3 },
  silver:  { mana: 4, stamina: 4, lifeForce: 4 },
  gold:    { mana: 5, stamina: 5, lifeForce: 5 },
  diamond: { mana: 6, stamina: 6, lifeForce: 6 }
};
