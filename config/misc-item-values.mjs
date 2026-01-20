/**
 * config/misc-item-values.mjs
 *
 * Human-editable rarity/value overrides for misc inventory catalog entries.
 *
 * Items DO NOT store coin strings.
 * They store:
 *  - rarity: string
 *  - value: number (base unit)
 *
 * Coin type and multipliers are derived from config/rarities.mjs.
 *
 * If an entry is missing here, it gets a safe default:
 *  - rarity: "common"
 *  - value: 1
 *
 * Override keys:
 *  - For essences:       use the slug, e.g. "fire", "void"
 *  - For quintessences:  use the slug, e.g. "fire", "void"
 *  - For awakening:      use the slug, e.g. "apocalypse", "earth"
 *
 * The catalog keys in config/misc-items.mjs are:
 *  - essence.<slug>
 *  - quintessence.<slug>
 *  - awakening.<slug>
 */

export const DEFAULT_MISC_VALUE_META = Object.freeze({
  rarity: "common",
  value: 1
});

/**
 * ESSENCE_VALUES["fire"] applies to catalog key "essence.fire"
 */
export const ESSENCE_VALUES = {
  // examples:
  // fire: { rarity: "common", value: 20 },
  // void: { rarity: "rare", value: 50 }
};

/**
 * QUINTESSENCE_VALUES["fire"] applies to catalog key "quintessence.fire"
 */
export const QUINTESSENCE_VALUES = {
  // examples:
  // fire: { rarity: "epic", value: 10 }
};

/**
 * AWAKENING_STONE_VALUES["apocalypse"] applies to catalog key "awakening.apocalypse"
 */
export const AWAKENING_STONE_VALUES = {
  // examples:
  // apocalypse: { rarity: "legendary", value: 1 }
};

/**
 * Optional: overrides for non-essence misc entries (sundries.*, other.*)
 * Keyed by full catalog key.
 */
export const MISC_VALUES = {
  // examples:
  // "sundries.rope-50ft": { rarity: "common", value: 2 },
  // "other.gemstone": { rarity: "uncommon", value: 5 }
};

function normalizeMeta(meta) {
  const r = String(meta?.rarity ?? "").trim() || DEFAULT_MISC_VALUE_META.rarity;
  const vRaw = Number(meta?.value);
  const v = Number.isFinite(vRaw) && vRaw >= 0 ? vRaw : DEFAULT_MISC_VALUE_META.value;
  return { rarity: r, value: v };
}

/**
 * Returns rarity/value for a given misc catalog key.
 * @param {string} key
 * @returns {{rarity: string, value: number}}
 */
export function getMiscItemValueMeta(key) {
  const k = String(key ?? "").trim();
  if (!k) return DEFAULT_MISC_VALUE_META;

  // Full-key overrides first (sundries.*, other.*, or any specific key)
  if (MISC_VALUES[k]) return normalizeMeta(MISC_VALUES[k]);

  // Namespace-based overrides
  if (k.startsWith("essence.")) {
    const slug = k.slice("essence.".length);
    if (ESSENCE_VALUES[slug]) return normalizeMeta(ESSENCE_VALUES[slug]);
    return DEFAULT_MISC_VALUE_META;
  }

  if (k.startsWith("quintessence.")) {
    const slug = k.slice("quintessence.".length);
    if (QUINTESSENCE_VALUES[slug]) return normalizeMeta(QUINTESSENCE_VALUES[slug]);
    return DEFAULT_MISC_VALUE_META;
  }

  if (k.startsWith("awakening.")) {
    const slug = k.slice("awakening.".length);
    if (AWAKENING_STONE_VALUES[slug]) return normalizeMeta(AWAKENING_STONE_VALUES[slug]);
    return DEFAULT_MISC_VALUE_META;
  }

  // Unknown namespace → safe default
  return DEFAULT_MISC_VALUE_META;
}
