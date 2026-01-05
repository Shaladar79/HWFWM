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
