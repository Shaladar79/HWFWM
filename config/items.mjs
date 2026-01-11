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
/* Equipment config (new)                        */
/* -------------------------------------------- */

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
 * This matches the schema you just locked in:
 * system.itemRank, system.category, system.readied (boolean), etc.
 */
export function normalizeConsumableSystem(system) {
  if (!system || typeof system !== "object") return;

  // Always-present, schema-backed fields
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
  // If a legacy key exists, prefer the new schema key when absent.
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

  // Type is your top-level branch: weapon | armor | misc (already in schema)
  system.type = (system.type ?? "weapon").toString();

  // Weapon subtree
  if (!system.weapon || typeof system.weapon !== "object") system.weapon = {};
  system.weapon.category = coerceEnum(system.weapon.category, WEAPON_CATEGORY_KEYS, "");

  // Weapon type depends on category
  if (system.weapon.category) {
    const allowed = WEAPON_TYPES_BY_CATEGORY[system.weapon.category] ?? [];
    system.weapon.weaponType = coerceOneOfStrings(system.weapon.weaponType, allowed, "");
  } else {
    // No category selected => clear weaponType to avoid invalid combos.
    system.weapon.weaponType = (system.weapon.weaponType ?? "").toString();
    if (system.weapon.weaponType) system.weapon.weaponType = "";
  }

  // Armor subtree
  if (!system.armor || typeof system.armor !== "object") system.armor = {};

  // We are treating system.armor.armorType as the *class* selector for now ("light|medium|heavy"),
  // because your current schema uses armor.armorType and your template labels it as Armor Type.
  // When you add the second dropdown in the sheet later, we'll store the specific type as armor.armorName
  // or armor.variant (schema-backed).
  system.armor.armorType = coerceEnum(system.armor.armorType, ARMOR_CLASS_KEYS, "");

  // Store the specific armor selection in armor.armorName (new field you will add to schema + sheet)
  // If it doesn't exist yet, keep it safe as a string.
  system.armor.armorName = (system.armor.armorName ?? "").toString();

  if (system.armor.armorType) {
    const allowedArmorNames = ARMOR_TYPES_BY_CLASS[system.armor.armorType] ?? [];
    system.armor.armorName = coerceOneOfStrings(system.armor.armorName, allowedArmorNames, "");
  } else {
    if (system.armor.armorName) system.armor.armorName = "";
  }

  // Numeric coercions for existing schema fields
  system.weapon.damagePerSuccess = coerceNumberOrZero(system.weapon.damagePerSuccess);
  system.weapon.range = coerceNumberOrZero(system.weapon.range);
  system.weapon.actionCost = coerceNumberOrZero(system.weapon.actionCost);

  system.armor.value = coerceNumberOrZero(system.armor.value);

  if (!system.misc || typeof system.misc !== "object") system.misc = {};
  system.misc.armor = coerceNumberOrZero(system.misc.armor);
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
        // Keep intentionally minimal to avoid accidental behavior changes.
        system.description = (system.description ?? "").toString();
        system.notes = (system.notes ?? "").toString();
        break;
    }
  }
}
