/**
 * Rank configuration (display + ordering only).
 * Mechanics (caps, scaling, etc.) come later.
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
 * Canonical ordering for dropdowns / progression.
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
 * Base attribute value granted by rank.
 * This is the starting value before racial/background/secondary modifiers.
 */
export const RANK_BASE_ATTRIBUTES = {
  normal: 30,
  iron: 35,
  bronze: 40,
  silver: 45,
  gold: 50,
  diamond: 55
};

