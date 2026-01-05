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

/**
 * Numeric tier value used for math / aggregation.
 * These values are summed across attributes to derive the character’s overall rank.
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
 * Convert the summed tier score into a derived rank key.
 *
 * Rules:
 *  - < 4      => normal
 *  - 4–7      => iron
 *  - 8–11     => bronze
 *  - 12–15    => silver
 *  - 16–19    => gold
 *  - 20+      => diamond
 */
export function deriveRankKeyFromTierTotal(total) {
  const t = Number(total) || 0;

  if (t >= 20) return "diamond";
  if (t >= 16) return "gold";
  if (t >= 12) return "silver";
  if (t >= 8) return "bronze";
  if (t >= 4) return "iron";
  return "normal";
}
