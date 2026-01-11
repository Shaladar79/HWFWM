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
 * Minimal normalizers for other item types can be added as you wire them.
 * Keep them intentionally shallow unless you explicitly request deeper wiring.
 */
export function normalizeEquipmentSystem(system) {
  if (!system || typeof system !== "object") return;

  // Make sure common text fields exist
  system.description = (system.description ?? "").toString();
  system.notes = (system.notes ?? "").toString();

  // You already handle array-row persistence in the equipment sheet.
  // Do NOT coerce those arrays here beyond simple safety guards.
  // (Leaving this as minimal on purpose.)
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

