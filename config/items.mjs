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
/* NEW: Canonical base tables + rank scaling      */
/* -------------------------------------------- */

/**
 * Rank multiplier applied to derived equipment totals.
 * Placeholder values for now; structure/keys are authoritative.
 */
export const ITEM_RANK_MULTIPLIER = Object.freeze({
  normal: 1.0,
  iron: 1.0,
  bronze: 1.0,
  silver: 1.0,
  gold: 1.0,
  diamond: 1.0
});

/**
 * Weapon base damage per success by weapon type (authoritative keys).
 * Placeholder numbers for now; you will fill real values later.
 */
export const WEAPON_BASE_DAMAGE_BY_TYPE = Object.freeze({
  Dagger: 0,
  Sword: 0,
  Axe: 0,
  Mace: 0,
  "Great Sword": 0,
  "Battle Axe": 0,
  Maul: 0,
  Spear: 0,
  Lance: 0,
  Staff: 0,
  Bow: 0,
  Crossbow: 0,
  Wand: 0,
  Gun: 0
});

/**
 * Weapon base action cost by weapon type (authoritative keys).
 * Placeholder numbers for now; you will fill real values later.
 */
export const WEAPON_BASE_ACTION_COST_BY_TYPE = Object.freeze({
  Dagger: 0,
  Sword: 0,
  Axe: 0,
  Mace: 0,
  "Great Sword": 0,
  "Battle Axe": 0,
  Maul: 0,
  Spear: 0,
  Lance: 0,
  Staff: 0,
  Bow: 0,
  Crossbow: 0,
  Wand: 0,
  Gun: 0
});

/**
 * Armor base value by armor name (authoritative keys).
 * Placeholder numbers for now; you will fill real values later.
 */
export const ARMOR_BASE_BY_NAME = Object.freeze({
  "Padded Armor": 0,
  Robe: 0,
  "Combat Robe": 0,
  Leather: 0,
  "Studded Leather": 0,
  Chainmail: 0,
  "Scale Mail": 0,
  "Half-Plate": 0,
  "Full Plate": 0
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
 */
export function normalizeEquipmentSystem(system) {
  if (!system || typeof system !== "object") return;

  // Shared fields
  system.itemRank = coerceEnum(system.itemRank, ITEM_RANK_KEYS, "normal");
  system.description = (system.description ?? "").toString();
  system.notes = (system.notes ?? "").toString();
  system.equipped = coerceBoolean(system.equipped);

  // Top-level equipment branch
  system.type = coerceEnum(system.type, EQUIPMENT_TYPE_KEYS, "weapon");

  // Compute rank multiplier (derived)
  const rankMult = ITEM_RANK_MULTIPLIER[system.itemRank] ?? 1;

  // Weapon subtree
  if (!system.weapon || typeof system.weapon !== "object") system.weapon = {};

  system.weapon.category = coerceEnum(system.weapon.category, WEAPON_CATEGORY_KEYS, "");
  system.weapon.weaponType = (system.weapon.weaponType ?? "").toString();

  if (system.weapon.category) {
    const allowed = WEAPON_TYPES_BY_CATEGORY[system.weapon.category] ?? [];
    system.weapon.weaponType = coerceOneOfStrings(system.weapon.weaponType, allowed, "");
  } else if (system.weapon.weaponType) {
    system.weapon.weaponType = "";
  }

  // Legacy fields (keep coerced for backward compatibility)
  system.weapon.damagePerSuccess = coerceNumberOrZero(system.weapon.damagePerSuccess);
  system.weapon.actionCost = coerceNumberOrZero(system.weapon.actionCost);

  // Player-editable (persisted) bonus fields
  system.weapon.bonusDamagePerSuccess = coerceNumberOrZero(system.weapon.bonusDamagePerSuccess);
  system.weapon.actionCostMod = coerceNumberOrZero(system.weapon.actionCostMod);

  // If an older item has values in legacy fields but bonus fields are absent,
  // mirror them into bonus fields at runtime so old data still "works" without a migration.
  // (This does not persist changes by itself.)
  if (
    (system.weapon.bonusDamagePerSuccess === 0 || system.weapon.bonusDamagePerSuccess === null) &&
    system.weapon.damagePerSuccess !== 0
  ) {
    system.weapon.bonusDamagePerSuccess = system.weapon.damagePerSuccess;
  }

  if (
    (system.weapon.actionCostMod === 0 || system.weapon.actionCostMod === null) &&
    system.weapon.actionCost !== 0
  ) {
    system.weapon.actionCostMod = system.weapon.actionCost;
  }

  // Keep editable for now (per your requirements)
  system.weapon.range = coerceNumberOrZero(system.weapon.range);

  system.weapon.damageType1 = (system.weapon.damageType1 ?? "").toString();
  system.weapon.damageType2 = (system.weapon.damageType2 ?? "").toString();
  system.weapon.damageType3 = (system.weapon.damageType3 ?? "").toString();

  // Weapon derived values
  const wt = (system.weapon.weaponType ?? "").toString();
  const baseDamage = WEAPON_BASE_DAMAGE_BY_TYPE[wt] ?? 0;
  const baseActionCost = WEAPON_BASE_ACTION_COST_BY_TYPE[wt] ?? 0;

  const bonusDamage = coerceNumberOrZero(system.weapon.bonusDamagePerSuccess);
  const actionCostMod = coerceNumberOrZero(system.weapon.actionCostMod);

  system.weapon.baseDamagePerSuccess = coerceNumberOrZero(baseDamage);
  system.weapon.baseActionCost = coerceNumberOrZero(baseActionCost);
  system.weapon.rankMultiplier = coerceNumberOrZero(rankMult);

  system.weapon.totalDamagePerSuccess =
    (system.weapon.baseDamagePerSuccess + bonusDamage) * system.weapon.rankMultiplier;

  system.weapon.totalActionCost = Math.max(
    0,
    system.weapon.baseActionCost + actionCostMod
  );

  // Armor subtree
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

  // Legacy field (currently editable armor number)
  system.armor.value = coerceNumberOrZero(system.armor.value);

  // Player-editable (persisted) bonus field
  system.armor.bonusArmor = coerceNumberOrZero(system.armor.bonusArmor);

  // If older item used system.armor.value, mirror it into bonusArmor at runtime
  // so existing items retain their entered armor without a migration.
  if (
    (system.armor.bonusArmor === 0 || system.armor.bonusArmor === null) &&
    system.armor.value !== 0
  ) {
    system.armor.bonusArmor = system.armor.value;
  }

  // Armor derived values
  const an = (system.armor.armorName ?? "").toString();
  const baseArmor = ARMOR_BASE_BY_NAME[an] ?? 0;
  const bonusArmor = coerceNumberOrZero(system.armor.bonusArmor);

  system.armor.baseArmor = coerceNumberOrZero(baseArmor);
  system.armor.rankMultiplier = coerceNumberOrZero(rankMult);
  system.armor.totalArmor = (system.armor.baseArmor + bonusArmor) * system.armor.rankMultiplier;

  // Misc subtree
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
