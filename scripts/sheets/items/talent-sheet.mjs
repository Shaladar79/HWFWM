// scripts/sheets/items/talent-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Talent Item Sheet (V13 Sheet V2)
 * - Talents are PASSIVE items that adjust the character (stats + grants)
 * - This sheet is data-entry only; no mechanics application logic here.
 */
export class HwfwmTalentSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "talent"],
    position: { width: 640, height: 680 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/talent-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Normalize common aliases so templates can use {{item}} and {{system}}
    context.item = this.document;
    context.system = this.document.system;

    // ---- dropdown/options scaffolding ----
    context.talentSources = [
      { value: "manual", label: "Manual" },
      { value: "race", label: "Race" },
      { value: "role", label: "Role" },
      { value: "background", label: "Background" },
      { value: "rank", label: "Rank" },
      { value: "system", label: "System" }
    ];

    context.stackModes = [
      { value: "stack", label: "Stack" },
      { value: "replace", label: "Replace" },
      { value: "none", label: "No Stacking" }
    ];

    context.attributesList = [
      { value: "power", label: "Power" },
      { value: "speed", label: "Speed" },
      { value: "spirit", label: "Spirit" },
      { value: "recovery", label: "Recovery" }
    ];

    context.resourcesList = [
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

    context.grantTypes = [
      { value: "specialties", label: "Specialties" },
      { value: "affinities", label: "Affinities" },
      { value: "aptitudes", label: "Aptitudes" },
      { value: "resistances", label: "Resistances" }
    ];

    // ---- Safe normalization for templates (UI-only) ----
    // Avoid template crashes when fields are missing in older items.
    const sys = context.system ?? {};
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

    context.system = sys;

    return context;
  }
}
