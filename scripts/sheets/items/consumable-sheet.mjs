// scripts/sheets/items/consumable-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

import { RANK_RESOURCE_MULTIPLIER } from "../../../config/ranks.mjs";

/**
 * HWFWM Consumable Item Sheet (V13 Sheet V2)
 * Category-driven layout:
 *  - category: damage | recovery
 *
 * Shared fields (always shown):
 *  - itemRank: normal | iron | bronze | silver | gold | diamond
 *
 * Damage fields:
 *  - damagePerSuccess (number)   // treated as BASE damage per success (editable)
 *  - damageType1/2/3 (string keys)
 *  - actionCost (number)
 *
 * Recovery fields:
 *  - recoveryType (lifeforce | mana | stamina)
 *  - recoveredPerRank (number)   // treated as BASE recovered per rank (editable)
 *  - actionCost (number) [shared]
 *
 * Derived display fields (read-only, UI only):
 *  - _derived.rankMultiplier
 *  - _derived.totalDamagePerSuccess
 *  - _derived.totalRecoveredPerRank
 */
export class HwfwmConsumableSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "consumable"],
    position: { width: 560, height: 540 },
    form: { submitOnChange: true, closeOnSubmit: false }
  });

  static PARTS = {
    form: { template: "systems/hwfwm-system/templates/item/consumable-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item = this.document;

    // Clone for render-safety (prevents accidental mutation of document.system)
    const system = foundry.utils.deepClone(this.document.system ?? {});
    system.description ??= ""; // render-safe

    // Normalize readied (schema is boolean; older items may have "yes"/"no")
    const r = system.readied;
    system.readied =
      r === true ||
      r === 1 ||
      r === "1" ||
      r === "true" ||
      r === "yes" ||
      r === "on";

    // Normalize itemRank (always present in UI)
    const ir = (system.itemRank ?? "normal").toString();
    system.itemRank = ["normal", "iron", "bronze", "silver", "gold", "diamond"].includes(ir)
      ? ir
      : "normal";

    // Normalize category (default to "damage" for stable conditional rendering)
    const cat = (system.category ?? "damage").toString();
    system.category = cat === "recovery" ? "recovery" : "damage";

    // Shared numeric fields
    system.actionCost = this._toNumberOrBlank(system.actionCost);

    // Damage (BASE)
    system.damagePerSuccess = this._toNumberOrBlank(system.damagePerSuccess);
    system.damageType1 = (system.damageType1 ?? "").toString();
    system.damageType2 = (system.damageType2 ?? "").toString();
    system.damageType3 = (system.damageType3 ?? "").toString();

    // Recovery (BASE)
    // Backward-compat display: if older items used system.recovered, show it as recoveredPerRank.
    const legacyRecovered = system.recovered;
    if (system.recoveredPerRank === undefined && legacyRecovered !== undefined) {
      system.recoveredPerRank = legacyRecovered;
    }
    system.recoveredPerRank = this._toNumberOrBlank(system.recoveredPerRank);

    const rt = (system.recoveryType ?? "").toString();
    system.recoveryType = ["lifeforce", "mana", "stamina"].includes(rt) ? rt : "";

    // -----------------------------
    // Derived display math (UI only)
    // -----------------------------
    system._derived = system._derived ?? {};

    const rankMultiplierRaw = RANK_RESOURCE_MULTIPLIER?.[system.itemRank];
    const rankMultiplier =
      Number.isFinite(Number(rankMultiplierRaw)) ? Number(rankMultiplierRaw) : 1;

    const baseDps = Number.isFinite(Number(system.damagePerSuccess))
      ? Number(system.damagePerSuccess)
      : 0;

    const baseRec = Number.isFinite(Number(system.recoveredPerRank))
      ? Number(system.recoveredPerRank)
      : 0;

    system._derived.rankMultiplier = rankMultiplier;
    system._derived.totalDamagePerSuccess = Math.round(baseDps * rankMultiplier);
    system._derived.totalRecoveredPerRank = Math.round(baseRec * rankMultiplier);

    context.system = system;

    // UI-only select options for template rendering
    context.itemRankOptions = [
      { value: "normal", label: "Normal" },
      { value: "iron", label: "Iron" },
      { value: "bronze", label: "Bronze" },
      { value: "silver", label: "Silver" },
      { value: "gold", label: "Gold" },
      { value: "diamond", label: "Diamond" }
    ];

    context.categoryOptions = [
      { value: "damage", label: "Damage" },
      { value: "recovery", label: "Recovery" }
    ];

    // If you already have a canonical list in CONFIG, swap this to use it.
    context.damageTypeOptions = [
      { value: "", label: "—" },
      { value: "physical", label: "Physical" },
      { value: "fire", label: "Fire" },
      { value: "ice", label: "Ice" },
      { value: "lightning", label: "Lightning" },
      { value: "poison", label: "Poison" },
      { value: "necrotic", label: "Necrotic" },
      { value: "radiant", label: "Radiant" },
      { value: "force", label: "Force" }
    ];

    context.recoveryTypeOptions = [
      { value: "", label: "—" },
      { value: "lifeforce", label: "Life Force" },
      { value: "mana", label: "Mana" },
      { value: "stamina", label: "Stamina" }
    ];

    // Convenience flags for conditional sections
    context.isDamage = system.category === "damage";
    context.isRecovery = system.category === "recovery";

    return context;
  }

  /**
   * Minimal coercion so submitOnChange doesn't store "on"/""/etc for numbers.
   * @override
   */
  async _updateObject(event, formData) {
    const flat =
      formData && typeof formData === "object"
        ? (foundry.utils.isObject(formData) ? foundry.utils.flattenObject(formData) : formData)
        : {};

    // Coerce readied to boolean, preferring the checkbox checked state when applicable
    const target = event?.target;
    const targetName = target?.getAttribute?.("name") ?? target?.name ?? "";
    if (targetName === "system.readied" && target instanceof HTMLInputElement) {
      flat["system.readied"] = !!target.checked;
    } else if ("system.readied" in flat) {
      const r = flat["system.readied"];
      flat["system.readied"] =
        r === true || r === 1 || r === "1" || r === "true" || r === "yes" || r === "on";
    }

    // Normalize itemRank if present
    if ("system.itemRank" in flat) {
      const ir = (flat["system.itemRank"] ?? "normal").toString();
      flat["system.itemRank"] = ["normal", "iron", "bronze", "silver", "gold", "diamond"].includes(ir)
        ? ir
        : "normal";
    }

    // Normalize category if present
    if ("system.category" in flat) {
      const v = (flat["system.category"] ?? "damage").toString();
      flat["system.category"] = v === "recovery" ? "recovery" : "damage";
    }

    // Coerce shared numeric fields
    if ("system.actionCost" in flat) {
      flat["system.actionCost"] = this._toNumberOrBlank(flat["system.actionCost"]);
    }

    // Coerce damage numeric (BASE)
    if ("system.damagePerSuccess" in flat) {
      flat["system.damagePerSuccess"] = this._toNumberOrBlank(flat["system.damagePerSuccess"]);
    }

    // Coerce recovery numeric (BASE)
    if ("system.recoveredPerRank" in flat) {
      flat["system.recoveredPerRank"] = this._toNumberOrBlank(flat["system.recoveredPerRank"]);
    }

    // Normalize recoveryType if present
    if ("system.recoveryType" in flat) {
      const rt = (flat["system.recoveryType"] ?? "").toString();
      flat["system.recoveryType"] = ["lifeforce", "mana", "stamina"].includes(rt) ? rt : "";
    }

    const expanded = foundry.utils.expandObject(flat);
    return super._updateObject(event, expanded);
  }

  _toNumberOrBlank(value) {
    if (value === null || value === undefined) return "";
    if (value === "") return "";
    const n = Number(value);
    return Number.isFinite(n) ? n : "";
  }
}
