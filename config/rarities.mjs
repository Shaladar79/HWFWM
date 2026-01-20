// config/rarities.mjs
//
// Rarity → Coin denomination + value multiplier
// Used by misc inventory display + total value math.
// NOTE: "value" stored on misc items is always a base numeric value.
// The displayed value is: value * mult, shown in the rarity's coin.

export const HWFWM_RARITY_VALUE_RULES = {
  common: {
    coin: "LSC", // Lesser Spirit Coin
    mult: 1
  },

  uncommon: {
    coin: "LSC",
    mult: 3
  },

  rare: {
    coin: "ISC", // Iron Spirit Coin
    mult: 1
  },

  epic: {
    coin: "ISC",
    mult: 3
  },

  legendary: {
    coin: "SSC", // Silver Spirit Coin
    mult: 1
  }
};

export const HWFWM_RARITY_KEYS = /** @type {const} */ (Object.freeze(Object.keys(HWFWM_RARITY_VALUE_RULES)));

/**
 * Safe lookup for rarity rules with fallback.
 * @param {string} rarity
 * @returns {{coin:string, mult:number}}
 */
export function getRarityValueRule(rarity) {
  const key = String(rarity ?? "").trim();
  return HWFWM_RARITY_VALUE_RULES[key] ?? HWFWM_RARITY_VALUE_RULES.common;
}
