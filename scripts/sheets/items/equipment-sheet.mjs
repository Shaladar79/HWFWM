// scripts/sheets/items/equipment-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Equipment Item Sheet (V13 Sheet V2)
 * - Supports a "type" dropdown: weapon | armor | misc
 * - Template conditionally displays sections based on type
 * - UI-only: provides safe defaults + option lists derived from CONFIG catalogs
 */
export class HwfwmEquipmentSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "equipment"],
    position: { width: 640, height: 620 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/equipment-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Normalize common aliases so templates can use {{item}} and {{system}}
    context.item = this.document;
    context.system = this.document.system ?? {};

    // ---------------------------------------------------------------------
    // Baseline dropdowns
    // ---------------------------------------------------------------------
    context.equipmentTypes = [
      { value: "weapon", label: "Weapon" },
      { value: "armor", label: "Armor" },
      { value: "misc", label: "Misc" }
    ];

    // Attribute list used by the Adjustments section
    context.attributesList = [
      { value: "power", label: "Power" },
      { value: "speed", label: "Speed" },
      { value: "spirit", label: "Spirit" },
      { value: "recovery", label: "Recovery" }
    ];

    // Determine current equipment type
    const type = (context.system?.type ?? context.system?.category ?? "weapon").toString();
    context._ui = {
      type,
      isWeapon: type === "weapon",
      isArmor: type === "armor",
      isMisc: type === "misc"
    };

    // ---------------------------------------------------------------------
    // OPTION LISTS (derived from live catalogs in CONFIG["hwfwm-system"])
    // ---------------------------------------------------------------------
    const cfg = CONFIG["hwfwm-system"] ?? {};

    const specialtyCatalog = cfg.specialtyCatalog ?? {};
    const affinityCatalog = cfg.affinityCatalog ?? {};
    const resistanceCatalog = cfg.resistanceCatalog ?? {};

    // Specialty Types derived from specialtyCatalog.attribute (power/speed/spirit/recovery)
    const specialtyTypeOrder = ["power", "speed", "spirit", "recovery"];
    const specialtyTypeLabels = {
      power: "Power",
      speed: "Speed",
      spirit: "Spirit",
      recovery: "Recovery"
    };

    const typesFound = new Set();
    const specialtiesByType = {};

    for (const [key, meta] of Object.entries(specialtyCatalog)) {
      const rawAttr = String(meta?.attribute ?? "").trim();
      if (!rawAttr) continue;

      const t = rawAttr.toLowerCase();
      if (!specialtyTypeOrder.includes(t)) continue;

      typesFound.add(t);
      specialtiesByType[t] ??= [];
      specialtiesByType[t].push({ value: key, label: meta?.name ?? key });
    }

    // Sort specialties per type
    for (const t of Object.keys(specialtiesByType)) {
      specialtiesByType[t].sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }

    context.specialtyTypeOptions = specialtyTypeOrder
      .filter((t) => typesFound.has(t))
      .map((t) => ({ value: t, label: specialtyTypeLabels[t] ?? t }));

    context.specialtiesByType = specialtiesByType;

    // Simple catalog -> options helper
    const toOptions = (catalog) =>
      Object.entries(catalog)
        .map(([key, meta]) => ({ value: key, label: meta?.name ?? key }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));

    context.affinityOptions = toOptions(affinityCatalog);
    context.resistanceOptions = toOptions(resistanceCatalog);

    // ---------------------------------------------------------------------
    // SAFE NORMALIZATION (prevents undefined nested paths)
    // ---------------------------------------------------------------------
    const sys = context.system;

    // Equipped should be boolean for checkbox
    sys.equipped = !!sys.equipped;

    // Ensure sub-objects exist for new fields
    sys.weapon ??= {};
    sys.armor ??= {};
    sys.misc ??= {};

    // Weapon defaults
    sys.weapon.category ??= "";
    sys.weapon.weaponType ??= "";
    sys.weapon.damagePerSuccess ??= 0;
    sys.weapon.range ??= 0;
    sys.weapon.actionCost ??= 0;
    sys.weapon.damageType1 ??= "";
    sys.weapon.damageType2 ??= "";
    sys.weapon.damageType3 ??= "";
    sys.weapon.description ??= "";

    // Armor defaults
    sys.armor.value ??= 0;
    sys.armor.armorType ??= "";
    sys.armor.description ??= "";

    // Misc defaults
    sys.misc.armor ??= 0;
    sys.misc.description ??= "";

    // Adjustments container
    sys.adjustments ??= {};
    sys.adjustments.attributes ??= {};
    sys.adjustments.resources ??= {};

    // Attributes: flat only
    for (const a of context.attributesList) {
      sys.adjustments.attributes[a.value] ??= {};
      if (typeof sys.adjustments.attributes[a.value].flat !== "number") {
        // Preserve existing values if present, but default missing to 0
        sys.adjustments.attributes[a.value].flat ??= 0;
      }
    }

    // Resources: pct+flat for LF/Mana/Stamina; flat-only for others
    const ensurePctFlat = (k) => {
      sys.adjustments.resources[k] ??= {};
      sys.adjustments.resources[k].pct ??= 0;
      sys.adjustments.resources[k].flat ??= 0;
    };
    const ensureFlat = (k) => {
      sys.adjustments.resources[k] ??= {};
      sys.adjustments.resources[k].flat ??= 0;
    };

    ensurePctFlat("lifeForce");
    ensurePctFlat("mana");
    ensurePctFlat("stamina");

    ensureFlat("trauma");
    ensureFlat("pace");
    ensureFlat("reaction");
    ensureFlat("defense");
    ensureFlat("naturalArmor");

    // Repeatable rows: ensure arrays exist and render at least one row
    sys.adjustments.specialties ??= [];
    sys.adjustments.affinities ??= [];
    sys.adjustments.resistances ??= [];

    const ensureMinRows = (arr, factory) => {
      if (!Array.isArray(arr)) return [factory()];
      if (arr.length < 1) arr.push(factory());
      return arr;
    };

    sys.adjustments.specialties = ensureMinRows(sys.adjustments.specialties, () => ({
      type: "",
      key: ""
    }));

    sys.adjustments.affinities = ensureMinRows(sys.adjustments.affinities, () => ({
      key: ""
    }));

    sys.adjustments.resistances = ensureMinRows(sys.adjustments.resistances, () => ({
      key: ""
    }));

    // Re-attach normalized system to context
    context.system = sys;
    return context;
  }
}
