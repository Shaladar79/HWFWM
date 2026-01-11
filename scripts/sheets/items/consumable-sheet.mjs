// scripts/sheets/items/consumable-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Consumable Item Sheet (V13 Sheet V2)
 * Category-driven layout:
 *  - category: damage | recovery
 *
 * Damage fields:
 *  - damagePerSuccess (number)
 *  - damageType1/2/3 (string keys)
 *  - actionCost (number)
 *
 * Recovery fields:
 *  - recovered (number)
 *  - recoveryType (lifeforce | mana | stamina)
 *  - actionCost (number)  [shared field]
 *
 * Notes:
 * - Uses fixed keys instead of arrays to avoid V13 submitOnChange array pitfalls.
 * - No mechanics wiring; purely schema + UI persistence.
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

    // Normalize category (default to "damage" for stable conditional rendering)
    const cat = (system.category ?? "damage").toString();
    system.category = cat === "recovery" ? "recovery" : "damage";

    // Shared numeric fields
    system.actionCost = this._toNumberOrBlank(system.actionCost);

    // Damage
    system.damagePerSuccess = this._toNumberOrBlank(system.damagePerSuccess);
    system.damageType1 = (system.damageType1 ?? "").toString();
    system.damageType2 = (system.damageType2 ?? "").toString();
    system.damageType3 = (system.damageType3 ?? "").toString();

    // Recovery
    system.recovered = this._toNumberOrBlank(system.recovered);
    const rt = (system.recoveryType ?? "").toString();
    system.recoveryType = ["lifeforce", "mana", "stamina"].includes(rt) ? rt : "";

    context.system = system;

    // UI-only select options for template rendering
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

    // Normalize category if present
    if ("system.category" in flat) {
      const v = (flat["system.category"] ?? "damage").toString();
      flat["system.category"] = v === "recovery" ? "recovery" : "damage";
    }

    // Coerce shared numeric fields
    if ("system.actionCost" in flat) {
      flat["system.actionCost"] = this._toNumberOrBlank(flat["system.actionCost"]);
    }

    // Coerce damage numeric
    if ("system.damagePerSuccess" in flat) {
      flat["system.damagePerSuccess"] = this._toNumberOrBlank(flat["system.damagePerSuccess"]);
    }

    // Coerce recovery numeric
    if ("system.recovered" in flat) {
      flat["system.recovered"] = this._toNumberOrBlank(flat["system.recovered"]);
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
