// config/items.mjs

/**
 * HWFWM Item configuration + normalization.
 * Foundry v13+ (v15-safe).
 *
 * This file:
 * - Defines canonical enums for item fields (for sheets + mechanics)
 * - Exposes normalization helpers
 * - Defines the HwfwmItem document class used by CONFIG.Item.documentClass
 *
 * IMPORTANT:
 * - This is NOT a migration system.
 * - Normalization here is runtime-only (keeps data consistent for UI + mechanics).
 *
 * Equipment Derived-Field Contract (Phase 1 foundation):
 * - Weapon derived (read-only targets for sheets):
 *   system.weapon.baseDamagePerSuccess   (from weaponType)
 *   system.weapon.rankMultiplier         (from itemRank)
 *   system.weapon.totalDamagePerSuccess  ((base + bonus) * rankMultiplier)
 * - Weapon persisted (player editable):
 *   system.weapon.bonusDamagePerSuccess
 * - Armor derived:
 *   system.armor.rankMultiplier          (from itemRank)
 *   system.armor.totalArmor              ((baseArmor + bonusArmor) * rankMultiplier)
 * - Armor persisted (player editable):
 *   system.armor.bonusArmor
 *
 * Legacy compatibility:
 * - We keep system.weapon.damagePerSuccess and system.weapon.actionCost populated
 *   at runtime for any existing UI/templates still reading those fields.
 */

/* -------------------------------------------- */
/* Enums (canonical keys)                        */
/* -------------------------------------------- */

export const ITEM_RANK_KEYS = Object.freeze([
  "normal",
  "iron",
  "bronze",
  "silver",
  "gold",
  "diamond"
]);

export const CONSUMABLE_CATEGORY_KEYS = Object.freeze(["damage", "recovery"]);

export const RECOVERY_TYPE_KEYS = Object.freeze(["lifeforce", "mana", "stamina"]);

/**
 * Damage types are currently UI-only convenience keys.
 * Replace/extend later if you add a canonical CONFIG damage type list.
 */
export const DAMAGE_TYPE_KEYS = Object.freeze([
  "physical",
  "fire",
  "ice",
  "lightning",
  "poison",
  "necrotic",
  "radiant",
  "force"
]);

/* -------------------------------------------- */
/* Equipment config                              */
/* -------------------------------------------- */

export const EQUIPMENT_TYPE_KEYS = Object.freeze(["weapon", "armor", "misc"]);

export const WEAPON_CATEGORY_KEYS = Object.freeze(["melee", "ranged"]);

export const WEAPON_TYPES_BY_CATEGORY = Object.freeze({
  melee: Object.freeze([
    "Dagger",
    "Sword",
    "Axe",
    "Mace",
    "Great Sword",
    "Battle Axe",
    "Maul",
    "Spear",
    "Lance",
    "Staff"
  ]),
  ranged: Object.freeze(["Bow", "Crossbow", "Wand", "Gun"])
});

/**
 * Canonical armor class keys (used for branching).
 * Labels are handled by the sheet/template.
 */
export const ARMOR_CLASS_KEYS = Object.freeze(["light", "medium", "heavy"]);

export const ARMOR_TYPES_BY_CLASS = Object.freeze({
  light: Object.freeze(["Padded Armor", "Robe", "Combat Robe"]),
  medium: Object.freeze(["Leather", "Studded Leather", "Chainmail"]),
  heavy: Object.freeze(["Scale Mail", "Half-Plate", "Full Plate"])
});

/* -------------------------------------------- */
/* Canonical base tables + rank scaling          */
/* -------------------------------------------- */

/**
 * Rank multiplier applied to derived equipment totals.
 * Placeholder values for now; structure/keys are authoritative.
 */
export const ITEM_RANK_MULTIPLIER = Object.freeze({
  normal: 1.0,
  iron: 1.5,
  bronze: 2.2,
  silver: 2.8,
  gold: 3.5,
  diamond: 5.0
});

/**
 * Weapon base damage per success by weapon type (authoritative keys).
 * Placeholder numbers for now; you will fill real values later.
 */
export const WEAPON_BASE_DAMAGE_BY_TYPE = Object.freeze({
  Dagger: 1,
  Sword: 2,
  Axe: 3,
  Mace: 2,
  "Great Sword": 4,
  "Battle Axe": 5,
  Maul: 4,
  Spear: 3,
  Lance: 4,
  Staff: 2,
  Bow: 2,
  Crossbow: 3,
  Wand: 2,
  Gun: 3
});

/**
 * Weapon base action cost by weapon type (authoritative keys).
 * Placeholder numbers for now; you will fill real values later.
 */
export const WEAPON_BASE_ACTION_COST_BY_TYPE = Object.freeze({
  Dagger: 2,
  Sword: 3,
  Axe: 4,
  Mace: 4,
  "Great Sword": 5,
  "Battle Axe": 6,
  Maul: 6,
  Spear: 3,
  Lance: 4,
  Staff: 2,
  Bow: 3,
  Crossbow: 5,
  Wand: 2,
  Gun: 3
});

/**
 * Armor base value by armor name (authoritative keys).
 * Placeholder numbers for now; you will fill real values later.
 */
export const ARMOR_BASE_BY_NAME = Object.freeze({
  "Padded Armor": 5,
  Robe: 5,
  "Combat Robe": 10,
  Leather: 15,
  "Studded Leather": 20,
  Chainmail: 30,
  "Scale Mail": 35,
  "Half-Plate": 40,
  "Full Plate": 50
});

/* -------------------------------------------- */
/* Helper coercion                               */
/* -------------------------------------------- */

export function coerceBoolean(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "yes" ||
    value === "on"
  );
}

export function coerceEnum(value, allowed, fallback) {
  const v = (value ?? "").toString();
  return allowed.includes(v) ? v : fallback;
}

export function coerceNumberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Coerce a string to one of the allowed display strings (case-sensitive),
 * otherwise fallback.
 */
export function coerceOneOfStrings(value, allowedStrings, fallback = "") {
  const v = (value ?? "").toString();
  return allowedStrings.includes(v) ? v : fallback;
}

/* -------------------------------------------- */
/* Item type normalizers                         */
/* -------------------------------------------- */

/**
 * Normalizes consumable system data in-place (runtime-only).
 * This matches the schema you locked in:
 * system.itemRank, system.category, system.readied (boolean), etc.
 */
export function normalizeConsumableSystem(system) {
  if (!system || typeof system !== "object") return;

  system.itemRank = coerceEnum(system.itemRank, ITEM_RANK_KEYS, "normal");
  system.category = coerceEnum(system.category, CONSUMABLE_CATEGORY_KEYS, "damage");

  system.quantity = coerceNumberOrZero(system.quantity);

  // Schema is boolean; older items may have "yes"/"no"
  system.readied = coerceBoolean(system.readied);

  system.description = (system.description ?? "").toString();
  system.notes = (system.notes ?? "").toString();

  // Damage block
  system.damagePerSuccess = coerceNumberOrZero(system.damagePerSuccess);
  system.actionCost = coerceNumberOrZero(system.actionCost);

  system.damageType1 = (system.damageType1 ?? "").toString();
  system.damageType2 = (system.damageType2 ?? "").toString();
  system.damageType3 = (system.damageType3 ?? "").toString();

  // Recovery block
  system.recoveryType = coerceEnum(system.recoveryType, RECOVERY_TYPE_KEYS, "");
  system.recoveredPerRank = coerceNumberOrZero(system.recoveredPerRank);

  // Legacy compatibility (display/use only). We do not persist changes here.
  if (system.recoveredPerRank === 0 && system.recovered !== undefined) {
    const legacy = Number(system.recovered);
    if (Number.isFinite(legacy) && legacy > 0) system.recoveredPerRank = legacy;
  }

  // Keep for now even if not rendered; avoids surprises if used elsewhere.
  system.useEffect = (system.useEffect ?? "").toString();
}

/**
 * Normalizes equipment system data in-place (runtime-only).
 * Keeps array-backed repeatable rows untouched (equipment sheet handles those).
 *
 * Data safety note:
 * - Bonus fields are player-editable and should be persisted in template.json.
 * - Derived fields are computed each prepareDerivedData run; they do not need persistence.
 */
export function normalizeEquipmentSystem(system) {
  if (!system || typeof system !== "object") return;

  // Shared fields
  system.itemRank = coerceEnum(system.itemRank, ITEM_RANK_KEYS, "normal");
  system.description = (system.description ?? "").toString();
  system.notes = (system.notes ?? "").toString();
  system.equipped = coerceBoolean(system.equipped);

  // Legendary flag:
  // - Persisted in template.json
  // - Valid only for Iron+; Normal rank cannot be legendary
  system.legendary = coerceBoolean(system.legendary);
  if (system.itemRank === "normal") system.legendary = false;

  // Top-level equipment branch
  system.type = coerceEnum(system.type, EQUIPMENT_TYPE_KEYS, "weapon");

  // Compute rank multiplier (derived)
  const rankMult = coerceNumberOrZero(ITEM_RANK_MULTIPLIER[system.itemRank] ?? 1);

  /* ---------------------------------------- */
  /* Weapon subtree                            */
  /* ---------------------------------------- */

  if (!system.weapon || typeof system.weapon !== "object") system.weapon = {};

  system.weapon.category = coerceEnum(system.weapon.category, WEAPON_CATEGORY_KEYS, "");
  system.weapon.weaponType = (system.weapon.weaponType ?? "").toString();

  if (system.weapon.category) {
    const allowed = WEAPON_TYPES_BY_CATEGORY[system.weapon.category] ?? [];
    system.weapon.weaponType = coerceOneOfStrings(system.weapon.weaponType, allowed, "");
  } else if (system.weapon.weaponType) {
    system.weapon.weaponType = "";
  }

  // Legacy fields (coerce only; kept for compatibility)
  system.weapon.damagePerSuccess = coerceNumberOrZero(system.weapon.damagePerSuccess);
  system.weapon.actionCost = coerceNumberOrZero(system.weapon.actionCost);

  // Capture raw bonus fields BEFORE coercion so we can detect "missing" (undefined)
  const rawBonusDps = system.weapon.bonusDamagePerSuccess;
  const rawActionMod = system.weapon.actionCostMod;

  // Player-editable (persisted) bonus fields
  system.weapon.bonusDamagePerSuccess = coerceNumberOrZero(system.weapon.bonusDamagePerSuccess);
  system.weapon.actionCostMod = coerceNumberOrZero(system.weapon.actionCostMod);

  // Legacy mapping (runtime-only):
  // If this item predates the bonus fields, treat legacy damagePerSuccess/actionCost
  // as the "bonus" fields only when bonus fields are truly absent (undefined).
  if (rawBonusDps === undefined && system.weapon.damagePerSuccess !== 0) {
    system.weapon.bonusDamagePerSuccess = system.weapon.damagePerSuccess;
  }
  if (rawActionMod === undefined && system.weapon.actionCost !== 0) {
    system.weapon.actionCostMod = system.weapon.actionCost;
  }

  // Keep editable for now (per your current schema)
  system.weapon.range = coerceNumberOrZero(system.weapon.range);

  system.weapon.damageType1 = (system.weapon.damageType1 ?? "").toString();
  system.weapon.damageType2 = (system.weapon.damageType2 ?? "").toString();
  system.weapon.damageType3 = (system.weapon.damageType3 ?? "").toString();

  // Weapon derived values (authoritative)
  const wt = (system.weapon.weaponType ?? "").toString();
  const baseDamage = coerceNumberOrZero(WEAPON_BASE_DAMAGE_BY_TYPE[wt] ?? 0);
  const baseActionCost = coerceNumberOrZero(WEAPON_BASE_ACTION_COST_BY_TYPE[wt] ?? 0);

  const bonusDamage = coerceNumberOrZero(system.weapon.bonusDamagePerSuccess);
  const actionCostMod = coerceNumberOrZero(system.weapon.actionCostMod);

  system.weapon.baseDamagePerSuccess = baseDamage;
  system.weapon.rankMultiplier = rankMult;
  system.weapon.totalDamagePerSuccess = (baseDamage + bonusDamage) * rankMult;

  // Action cost derived (not required by the Phase 1 manifest, but safe + useful)
  system.weapon.baseActionCost = baseActionCost;
  system.weapon.totalActionCost = Math.max(0, baseActionCost + actionCostMod);

  // Legacy sync (runtime-only): keep older UI/templates functional
  system.weapon.damagePerSuccess = system.weapon.totalDamagePerSuccess;
  system.weapon.actionCost = system.weapon.totalActionCost;

  /* ---------------------------------------- */
  /* Armor subtree                             */
  /* ---------------------------------------- */

  if (!system.armor || typeof system.armor !== "object") system.armor = {};

  // armorType = armor class (light|medium|heavy)
  system.armor.armorType = coerceEnum(system.armor.armorType, ARMOR_CLASS_KEYS, "");

  // armorName = specific armor name under that class
  system.armor.armorName = (system.armor.armorName ?? "").toString();

  if (system.armor.armorType) {
    const allowedArmorNames = ARMOR_TYPES_BY_CLASS[system.armor.armorType] ?? [];
    system.armor.armorName = coerceOneOfStrings(system.armor.armorName, allowedArmorNames, "");
  } else if (system.armor.armorName) {
    system.armor.armorName = "";
  }

  // Legacy editable field (left intact for now; sheet will eventually stop using it)
  system.armor.value = coerceNumberOrZero(system.armor.value);

  // Capture raw bonus field BEFORE coercion so we can detect "missing"
  const rawBonusArmor = system.armor.bonusArmor;

  // Player-editable (persisted) bonus field
  system.armor.bonusArmor = coerceNumberOrZero(system.armor.bonusArmor);

  // Legacy mapping (runtime-only): if item predates bonusArmor, use legacy value as bonus only when missing
  if (rawBonusArmor === undefined && system.armor.value !== 0) {
    system.armor.bonusArmor = system.armor.value;
  }

  // Armor derived values (authoritative)
  const an = (system.armor.armorName ?? "").toString();
  const baseArmor = coerceNumberOrZero(ARMOR_BASE_BY_NAME[an] ?? 0);
  const bonusArmor = coerceNumberOrZero(system.armor.bonusArmor);

  system.armor.baseArmor = baseArmor;
  system.armor.rankMultiplier = rankMult;
  system.armor.totalArmor = (baseArmor + bonusArmor) * rankMult;

  /* ---------------------------------------- */
  /* Misc subtree                              */
  /* ---------------------------------------- */

  if (!system.misc || typeof system.misc !== "object") system.misc = {};
  system.misc.armor = coerceNumberOrZero(system.misc.armor);

  // NOTE: adjustments arrays are handled by the sheet and intentionally not touched here.
}

/* -------------------------------------------- */
/* Item Document Class                           */
/* -------------------------------------------- */

export class HwfwmItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = this.system;
    if (!system || typeof system !== "object") return;

    switch (this.type) {
      case "consumable":
        normalizeConsumableSystem(system);
        break;

      case "equipment":
        normalizeEquipmentSystem(system);
        break;

      // Stubs for future wiring (no-op for now)
      case "feature":
      case "talent":
      case "ability":
      case "miscItem":
      default:
        system.description = (system.description ?? "").toString();
        system.notes = (system.notes ?? "").toString();
        break;
    }
  }
}
