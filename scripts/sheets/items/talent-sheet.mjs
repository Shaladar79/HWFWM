// scripts/sheets/items/talent-sheet.mjs

/**
 * HWFWM Talent Item Sheet
 * - Talents are PASSIVE items that adjust the character (stats + grants)
 * - This sheet is data-entry only; no mechanics application logic here.
 */
export class HwfwmTalentSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "talent"],
      width: 640,
      height: 680,
      resizable: true,

      // IMPORTANT: ensure form fields persist to the Item document
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/talent-sheet.hbs";
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    // ---- dropdown/options scaffolding ----
    data.talentSources = [
      { value: "manual", label: "Manual" },
      { value: "race", label: "Race" },
      { value: "role", label: "Role" },
      { value: "background", label: "Background" },
      { value: "rank", label: "Rank" },
      { value: "system", label: "System" }
    ];

    data.stackModes = [
      { value: "stack", label: "Stack" },
      { value: "replace", label: "Replace" },
      { value: "none", label: "No Stacking" }
    ];

    data.attributesList = [
      { value: "power", label: "Power" },
      { value: "speed", label: "Speed" },
      { value: "spirit", label: "Spirit" },
      { value: "recovery", label: "Recovery" }
    ];

    data.resourcesList = [
      { value: "lifeForce", label: "Life Force" },
      { value: "mana", label: "Mana" },
      { value: "stamina", label: "Stamina" },
      { value: "shielding", label: "Shielding" },
      { value: "armor", label: "Armor" },
      { value: "pace", label: "Pace" },
      { value: "reaction", label: "Reaction" },
      { value: "trauma", label: "Trauma" },
      { value: "defense", label: "Defense" },
      { value: "naturalArmor", label: "Natural Armor" }
    ];

    data.grantTypes = [
      { value: "specialties", label: "Specialties" },
      { value: "affinities", label: "Affinities" },
      { value: "aptitudes", label: "Aptitudes" },
      { value: "resistances", label: "Resistances" }
    ];

    // ---- Safe normalization for templates (UI-only) ----
    // Avoid template crashes when fields are missing in older items.
    const sys = data.system ?? (data.item?.system ?? {});
    sys.adjustments ??= {};
    sys.adjustments.attributes ??= {};
    sys.adjustments.resources ??= {};
    sys.adjustments.defense ??= {};
    sys.adjustments.pace ??= {};
    sys.adjustments.naturalArmor ??= {};

    sys.grants ??= {};
    sys.grants.specialties ??= [];
    sys.grants.affinities ??= [];
    sys.grants.aptitudes ??= [];
    sys.grants.resistances ??= [];

    // Ensure the merged/normalized system is visible to the template consistently
    data.system = sys;

    return data;
  }
}
